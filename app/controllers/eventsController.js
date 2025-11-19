/**
 * EVENT CONTROLLERS
 * Handles all logic for event operations
 * Each function corresponds to a route and handles the request/response cycle
 */

const prisma = require('../lib/prisma');
const { validateEventData, wantsJson } = require('../utils/validation');
const { MESSAGES, DEFAULTS } = require('../utils/constants');
const { writeFile, mkdir, unlink, rename } = require("fs/promises");
const { existsSync } = require("fs");
const path = require("path");
const Replicate = require("replicate");

const replicate = new Replicate();

/**
 * Get /events - List & filter all published events (student view) w/ pagination logic
 */
const event_index_student = async (req,res) => {
  try {

     //check if page/limit value parsed correctly
    const toInt = (v, def, min, max) => {
      const n = parseInt(v, 10);
      if(Number.isNaN(n)) return def;
      return Math.min(Math.max(n, min), max);
    };

    //check if time value parsed correctly
    const toDate = (v) => { 
      if(!v) return null;
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? null : d;
    };

    const ALLOWED_SORT = new Set(['startsAt', 'createdAt', 'title']);
    const ALLOWED_ORDER = new Set(['asc', 'desc']);

    //get query parameters
    const from = toDate(req.query.from);
    const to = toDate(req.query.to);
    const category = (req.query.category || '').trim() || null;
    const org = (req.query.org ||'').trim() || null;
    const search = (req.query.search || '').trim() || null;
    const page = toInt(req.query.page, 1, 1, 1000000);
    const limit = toInt(req.query.limit, 20, 1, 100);
    const sort = ALLOWED_SORT.has(req.query.sort) ? req.query.sort : 'startsAt';
    const order = ALLOWED_ORDER.has(req.query.order) ? req.query.order : 'asc';


    //prisma where only fills a filter if its corresponding query param exists. default filter: published = true. prevents filtering category: null etc

    /**@type {(import('../generated/prisma')).Prisma.EventWhereInput}*/
    const where = {

      //default
      published: true,
      moderationStatus: "approved",

      //Date filters
      ...(from || to 
        ? {
            startsAt: {
              ...(from ? {gte: from} : {}),
              ...(to ? {lte: to} : {}),
            },
        }
      : {}),

      //Category filter
      ...(category ? {category} : {}),

      //Search filters for title and description
      ...(search 
        ? {
          OR: [
            {title: {contains: search}},
            {description: {contains: search}},
          ],
        }
      : {}),

      //Organization filter (via organizer -> organizerId)
      ...(org
        ? {
          organizer: {
            organizationId: org,
          },
        }
      : {}),

    };

    //calculate pagination offsets
    const skip = (page - 1)*limit;
    const take = limit;

    //get sorting order
    const orderBy = {[sort]: order};

    //run count and paged queries
    const [total, events] = await Promise.all([
      prisma.event.count({where}),
      prisma.event.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          organizer: {
            select: {id: true, firstName: true, lastName: true, organizationId: true},
          },
          _count: {select: {tickets: true}},
        },
      }),
    ]);

    //Paginatino metadata
    const meta = {
      page,
      limit,
      total,
      pages: Math.ceil(total/limit),
      sort,
      order,
      filters: {from, to, category, org, search},
    };


    //return html by default, json if requested
    const {wantsJson} = require('../utils/validation');
    if(wantsJson(req)) {
      return res.json({data: events, meta});
    }

    //pass meta so the view shows filter state
    return res.render('student/index', {events, meta});
  } catch (error) {
    console.error('Error fetching events with filters:', error);
    return res.status(500).json({error: 'Failed to fetch events'});
  }
};

/**
 * GET /events/:id/ics — Download an ICS calendar file for a published event
 */
const event_ics = async (req, res) => {
  try {

    //load published event
    const ev = await prisma.event.findFirst({
      where: {id: req.params.id, published: true, moderationStatus: "approved"},
      select: {
        id:true,
        title:true,
        description:true,
        startsAt: true,
        endsAt: true,
        location: true,
      },
    });


    //throws 404 if event not loaded (not found or not published)
    if(!ev){
      return res.status(404).json({error: 'Event not found or not published.'});
    }

    //convert JS date to ICS format (UTC)
    const toICSDate = (d) => {
      const pad = (n) => String(n).padStart(2, '0'); //makes sure all numbers n are 2 digits
      const dt = new Date(d);
      return (
        dt.getUTCFullYear().toString() + 
        pad(dt.getUTCMonth() + 1) +
        pad(dt.getUTCDate()) + 'T' + 
        pad(dt.getUTCHours()) + 
        pad(dt.getUTCMinutes()) +
        pad(dt.getUTCSeconds()) + 'Z' //Z: ICS UTC flag
      );     
    };

    //escape special characters for ics safe text
    const escapeICSText = (s) =>
        String(s ?? '')
          .replace(/\\/g, '\\\\')
          .replace(/;/g, '\\;')
          .replace(/,/g, '\\,')
          .replace(/\r?\n/g, '\\n');

    //ics fields
    const uid = `${ev.id}@pioneers.local`; //event id
    const dtstamp = toICSDate(new Date()); //time of ics gen
    const dtstart = toICSDate(ev.startsAt); //event start UTC
    const dtend = toICSDate(ev.endsAt); //event end UTC

    const baseUrl = `${req.protocol}://${req.get('host')}`; //base app url
    const eventUrl = `${baseUrl}/events/${ev.id}`; //event url

    //construct ics file's lines
    const lines = [
      'BEGIN:VCALENDAR',

      'VERSION:2.0',
      'PRODID:-//Pioneers//Event Manager//EN',
      'CALSCALE:GREGORIAN',

      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${escapeICSText(ev.title)}`,
      `DESCRIPTION:${escapeICSText(ev.description || '')}`,
      `LOCATION:${escapeICSText(ev.location || '')}`,
      `URL:${eventUrl}`,
      'END:VEVENT',

      'END:VCALENDAR'
    ];
    const ics = lines.join('\r\n');

    // build filename w/o special characters from event title
    const safeTitle = (ev.title || 'event')
      .replace(/[^\w\-]+/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase();
    const filename = `${safeTitle || 'event'}.ics`;

    //send file as download
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(ics);
  } catch (error) {
    console.error('Error generating ICS:', error);
    return res.status(500).json({error: 'Failed to generate calendar file.'});
  }
};

/**
 * GET /events/:id - Get details of a specific published event (student view)
 */
const event_details_student = async (req, res) => {
  try {
    const event = await prisma.event.findFirst({
      where: { id: req.params.id, published: true, moderationStatus: "approved" },
      include: {
        organizer: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { tickets: true } },
      }
    });

    const accepts = (req.headers.accept || "").toLowerCase();
    const prefersHtml = accepts.includes("text/html") || accepts.includes("*/*");
    
    if (!event) {
      if (!prefersHtml && wantsJson(req)) {
        return res.status(404).json({ error: MESSAGES.EVENT_NOT_FOUND });
      }
      return res.status(404).render("student/show", { loadError: true });
    }

    const ticketsClaimed = event._count?.tickets ?? 0;
    const capacity = Number.isFinite(event.capacity) ? event.capacity : 0;
    const remaining = Math.max(capacity - ticketsClaimed, 0);
    const isFull = remaining <= 0;

    let ticket = null;
    if (req.user) {
      ticket = await prisma.ticket.findFirst({
        where: { eventId: event.id, userId: req.user.id },
        select: {
          id: true,
          status: true,
          claimedAt: true,
          usedAt: true,
        },
      });
    }

    const canClaim =
      !!req.user &&
      req.user.role === "student" &&
      !ticket &&
      !isFull;

    const formatDate = (value) => {
      if (!value) return 'Unknown date';
      return new Date(value).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    };

    const formatTime = (value) => {
      if (!value) return '';
      return new Date(value).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const formatted = {
      startsAt: formatDate(event.startsAt),
      endsAt: formatDate(event.endsAt),
      startsAtTime: formatTime(event.startsAt),
      endsAtTime: formatTime(event.endsAt),
    };

    if (!prefersHtml && wantsJson(req)) {
      return res.json({
        event,
        stats: {
          ticketsClaimed,
          capacity,
          remaining,
          isFull,
        },
        ticket,
        canClaim,
      });
    }

    return res.render("student/show", {
      event,
      stats: {
        ticketsClaimed,
        capacity,
        remaining,
        isFull,
      },
      ticket,
      canClaim,
      formatted,
      loadError: false,
    });

  } catch (error) {
    console.error('Error fetching event details:', error);
    if (wantsJson(req)) return res.status(500).json({ error: "Failed to fetch event details" });
    return res.status(500).render("student/show", {loadError: true});
  }
};

// ==================== ORGANIZER CONTROLLERS ====================

/**
 * GET /organizers/:organizerId/events - List all events for an organizer
 */
const event_index_organizer = async (req, res) => {
  try {
    const organizerId = req.organizerId;
    const events = await prisma.event.findMany({
      where: { organizerId },
      include: {
        tickets: { select: { status: true } },
        _count: { select: { tickets: true } },
      },
      orderBy: { createdAt: 'desc' }
    });


    const totals = {
      publishedCount: 0,
      draftCount: 0,
      ticketsSoldTotal: 0,
      capacityTotal: 0,
      checkedInTotal: 0,
      pendingModerationCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
    };

    const normalizedEvents = events.map((event) => {
      const { tickets, ...rest } = event;
      const capacity = Number.isFinite(event.capacity) ? event.capacity : 0;
      const ticketsSold = event._count?.tickets ?? 0;
      const checkedIn = tickets.filter((ticket) => ticket.status === 'used').length;
      const remaining = Math.max(capacity - ticketsSold, 0);
      const utilization = capacity ? Math.round((ticketsSold / capacity) * 100) : 0;
      const attendanceRate = ticketsSold ? Math.round((checkedIn / ticketsSold) * 100) : 0;

      totals.ticketsSoldTotal += ticketsSold;
      totals.capacityTotal += capacity;
      totals.checkedInTotal += checkedIn;
      if (event.published) {
        totals.publishedCount += 1;
      } else {
        totals.draftCount += 1;
      }

      // Track moderation status
      if (event.moderationStatus === 'pending') totals.pendingModerationCount += 1;
      if (event.moderationStatus === 'approved') totals.approvedCount += 1;
      if (event.moderationStatus === 'rejected') totals.rejectedCount += 1;

      return {
        ...rest,
        capacityValue: capacity,
        ticketsSold,
        checkedInCount: checkedIn,
        remaining,
        utilization,
        attendanceRate,
      };
    });

    const summary = {
      ...totals,
      utilizationTotal: totals.capacityTotal
        ? Math.round((totals.ticketsSoldTotal / totals.capacityTotal) * 100)
        : 0,
      attendanceRateTotal: totals.ticketsSoldTotal
        ? Math.round((totals.checkedInTotal / totals.ticketsSoldTotal) * 100)
        : 0,
    };

    return res.render('organizer/index', {
      events: normalizedEvents,
      organizerId,
      summary,
    });

    } catch (error) {
    console.error('Error fetching organizer events:', error);
    if (wantsJson(req)) {
      return res.status(500).json({ error: 'Failed to fetch your events' });
    }
    return res.status(500).render('organizer/index', {
      events: [],
      organizerId: req.organizerId,
      summary: {
        publishedCount: 0,
        draftCount: 0,
        ticketsSoldTotal: 0,
        capacityTotal: 0,
        checkedInTotal: 0,
        utilizationTotal: 0,
        attendanceRateTotal: 0,
      },
      loadError: true,
    });
  }
};

/**
 * GET /organizers/:organizerId/events/new - Show form to create new event
 */
const event_new_form = async (req, res) => {
  return res.render("organizer/new", {
    organizerId: req.organizerId,
    errors: [],
    values: { 
      type: DEFAULTS.EVENT_TYPE, 
      capacity: DEFAULTS.EVENT_CAPACITY 
    },
  });
};

/**
 * GET /organizers/:organizerId/events/:eventId - Get details of a specific event (organizer view)
 */
const event_details_organizer = async (req, res) => {
  try {
    const organizerId = req.organizerId;
    const event = await prisma.event.findFirst({
      where: { id: req.params.eventId, organizerId },
      include: {
        organizer: { 
          select: { id: true, firstName: true, lastName: true, email: true } 
        },
        tickets: { 
          include: { 
            user: { 
              select: { id: true, firstName: true, lastName: true, email: true } 
            } 
          } 
        },
        _count: { select: { tickets: true } },
      }
    });
    
    const isJsonRequest = wantsJson(req);
    
    if (!event) {
      if (isJsonRequest) {
        return res.status(404).json({ error: MESSAGES.EVENT_NOT_FOUND });
      }
      return res.status(404).render("organizer/show", {
        organizerId,
        event: null,
        errors: [MESSAGES.EVENT_NOT_FOUND],
      });
    }
    
    if (isJsonRequest) {
      return res.json(event);
    }
        
    const ticketsSold = event._count?.tickets ?? 0;
    const capacity = Number.isFinite(event.capacity) ? event.capacity : 0;
    const checkedIn = event.tickets.filter((ticket) => ticket.status === 'used').length;
    const remaining = Math.max(capacity - ticketsSold, 0);
    const utilization = capacity ? Math.round((ticketsSold / capacity) * 100) : 0;
    const attendanceRate = ticketsSold ? Math.round((checkedIn / ticketsSold) * 100) : 0;
    const revenue =
      event.type === 'paid' && typeof event.price === 'number'
        ? (event.price / 100) * ticketsSold
        : null;

    const analytics = {
      ticketsSold,
      capacity,
      remaining,
      utilization,
      checkedIn,
      attendanceRate,
      revenue,
    };

    return res.render("organizer/show", {
      organizerId,
      event,
      analytics,
      errors: [],
      flash: req.query.created ? MESSAGES.EVENT_CREATED : null,
    });
  } catch (error) {
    console.error('Error fetching event details:', error);
    
    if (wantsJson(req)) {
      return res.status(500).json({ error: MESSAGES.SERVER_ERROR });
    }
    
    return res.status(500).render("organizer/show", {
      organizerId: req.organizerId,
      event: null,
      errors: [MESSAGES.SERVER_ERROR],
    });
  }
};

/**
 * GET /organizers/:organizerId/events/:eventId/attendees.csv
 */
const event_export_attendees = async (req, res) => {
  try {
    const organizerId = req.organizerId;
    const eventId = req.params.eventId;
    const isAdmin = req.user?.role === "admin";

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        organizerId: true,
        tickets: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { claimedAt: "asc" },
        },
      },
    });

    if (!event || (!isAdmin && event.organizerId !== organizerId)) {
      if (wantsJson(req)) return res.status(404).json({ error: MESSAGES.EVENT_NOT_FOUND });
      return res.status(404).send(MESSAGES.EVENT_NOT_FOUND);
    }

    const escapeCsv = (value) => {
      const str = value === null || value === undefined ? '' : String(value);
      if (/[",\r\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const toIso = (value) => (value ? new Date(value).toISOString() : '');

    const header = ["Ticket ID", "First Name", "Last Name", "Email", "Status", "Claimed At", "Used At", "QR Token"];
    const rows = event.tickets.map((ticket) => [
      ticket.id,
      ticket.user?.firstName || "",
      ticket.user?.lastName || "",
      ticket.user?.email || "",
      ticket.status,
      toIso(ticket.claimedAt),
      toIso(ticket.usedAt),
      ticket.qrToken || "",
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="attendees-${event.id}.csv"`,
    );
    return res.status(200).send('\ufeff' + csv);
  } catch (error) {
    console.error("CSV export failed:", error);
    if (wantsJson(req)) return res.status(500).json({ error: MESSAGES.SERVER_ERROR });
    return res.status(500).send(MESSAGES.SERVER_ERROR);
  }
};

/**
 * POST /organizers/:organizerId/events - Create a new event
 */
const event_create = async (req, res) => {
  try {
    const organizerId = req.organizerId;
    const isJsonRequest = wantsJson(req);

    // Verify organizer exists and has correct role
    const organizer = await prisma.user.findUnique({ 
      where: { id: organizerId } 
    });
    
    if (!organizer || organizer.role !== "organizer") {
      const errorResponse = { error: MESSAGES.INVALID_ORGANIZER };
      
      if (isJsonRequest) {
        return res.status(400).json(errorResponse);
      }
      return res.status(400).render("organizer/new", {
        organizerId,
        errors: [MESSAGES.INVALID_ORGANIZER],
        values: req.body,
      });
    }

    // Validate event data using utility function
    const validation = validateEventData(req.body);
    
    if (!validation.isValid) {
      if (isJsonRequest) {
        return res.status(400).json({ 
          error: MESSAGES.VALIDATION_FAILED, 
          details: validation.errors 
        });
      }
      return res.status(422).render("organizer/new", {
        organizerId,
        errors: validation.errors,
        values: req.body,
      });
    }

    // Determine if event should be published
    const publishedRaw = req.body.published;
    const published = publishedRaw === true || 
                     publishedRaw === 'on' || 
                     publishedRaw === 'true';

    // Create the event in database
    const event = await prisma.event.create({
      data: {
        ...validation.validatedData,
        organizerId,
        published,
      },
    });

    // Send appropriate response
    if (isJsonRequest) {
      return res.status(201).json(event);
    }
    
    return res.redirect(`/organizers/${organizerId}/events/${event.id}?created=1`);
    
  } catch (error) {
    console.error('Error creating event:', error);
    const isJsonRequest = wantsJson(req);
    
    if (isJsonRequest) {
      return res.status(400).json({ 
        error: MESSAGES.EVENT_CREATE_FAILED, 
        details: error.message 
      });
    }
    
    return res.status(500).render("organizer/new", {
      organizerId: req.organizerId,
      errors: [MESSAGES.EVENT_CREATE_FAILED],
      values: req.body || {},
    });
  }
};

/**
 * DELETE /organizers/:organizerId/events/:eventId - Delete an event
 */
const event_delete = async (req, res) => {
  try {
    const organizerId = req.organizerId;
    
    // Delete only if event belongs to this organizer
    const result = await prisma.event.deleteMany({
      where: { 
        id: req.params.eventId, 
        organizerId 
      }
    });
    
    if (result.count === 0) {
      return res.status(404).json({ 
        error: MESSAGES.EVENT_NOT_FOUND 
      });
    }
    
    res.json({ 
      ok: true, 
      message: MESSAGES.EVENT_DELETED 
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(400).json({ error: MESSAGES.EVENT_DELETE_FAILED });
  }
};

/**
 * PATCH /organizers/:organizerId/events/:eventId/publish - Publish an event
 */
const event_publish = async (req, res) => {
  try {
    const organizerId = req.organizerId;
    
    // Update only if event belongs to this organizer
    const result = await prisma.event.updateMany({
      where: { 
        id: req.params.eventId, 
        organizerId 
      },
      data: { published: true },
    });
    
    if (result.count === 0) {
      return res.status(404).json({ 
        error: MESSAGES.EVENT_NOT_FOUND 
      });
    }
    
    res.json({ 
      ok: true, 
      message: MESSAGES.EVENT_PUBLISHED 
    });
  } catch (error) {
    console.error('Error publishing event:', error);
    res.status(400).json({ error: MESSAGES.EVENT_UPDATE_FAILED });
  }
};

/**
 * PATCH /organizers/:organizerId/events/:eventId/unpublish - Unpublish an event
 */
const event_unpublish = async (req, res) => {
  try {
    const organizerId = req.organizerId;
    
    // Update only if event belongs to this organizer
    const result = await prisma.event.updateMany({
      where: { 
        id: req.params.eventId, 
        organizerId 
      },
      data: { published: false },
    });
    
    if (result.count === 0) {
      return res.status(404).json({ 
        error: MESSAGES.EVENT_NOT_FOUND 
      });
    }
    
    res.json({ 
      ok: true, 
      message: MESSAGES.EVENT_UNPUBLISHED 
    });
  } catch (error) {
    console.error('Error unpublishing event:', error);
    res.status(400).json({ error: MESSAGES.EVENT_UPDATE_FAILED });
  }
};

const event_generate_image = async (req, res) => {
  try {
    const rawPrompt = req.body?.prompt;
    const prompt = typeof rawPrompt === 'string' ? rawPrompt.trim() : '';
    const eventId = req.params?.eventId;

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    // Fetch event data for auto-generation or validation
    const event = await prisma.event.findUnique({ 
      where: { id: eventId },
      select: { title: true, description: true, location: true, type: true, organizerId: true }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Verify event belongs to this organizer
    if (event.organizerId !== req.organizerId) {
      return res.status(403).json({ error: 'You cannot generate images for another organizer\'s event' });
    }

    const finalPrompt = prompt || 
      `Event banner for "${event.title}". ${event.description}. Location: ${event.location}. ${event.type} event.`;

    const input = {
      prompt: finalPrompt.slice(0, 1000),
      aspect_ratio: '16:9',
      output_format: 'png',
      safety_filter_level: 'block_medium_and_above',
    };

    const output = await replicate.run('google/imagen-4', { input });
    const imageUrl = typeof output?.url === 'function' ? output.url() : undefined;
    
    // Save to TEMP location (preview only, not final)
    const tempFileName = `event-${eventId}-preview.png`;
    const tempRelativePath = `/event-images/${tempFileName}`;
    const tempOutputPath = path.join(__dirname, '..', 'public', 'event-images', tempFileName);

    // Ensure the directory exists before writing the file
    const imageDir = path.join(__dirname, '..', 'public', 'event-images');
    if (!existsSync(imageDir)) {
      await mkdir(imageDir, { recursive: true });
    }
    await writeFile(tempOutputPath, output);
    
    // Return temp path for preview (DB not updated yet)
    res.json({ 
      imagePath: tempRelativePath, 
      imageUrl,
      isPreview: true 
    });
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
};

const event_accept_banner = async (req, res) => {
  try {
    const eventId = req.params?.eventId;
    const { previewPath } = req.body;

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    if (!previewPath) {
      return res.status(400).json({ error: 'Preview path is required' });
    }

    // Authorization check: Only the organizer can accept/finalize the banner
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true }
    });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (!req.user || event.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: Only the event organizer can accept the banner' });
    }
    // Move from temp preview to final location
    const tempFileName = `event-${eventId}-preview.png`;
    const finalFileName = `event-${eventId}.png`;
    const tempPath = path.join(__dirname, '..', 'public', 'event-images', tempFileName);
    const finalPath = path.join(__dirname, '..', 'public', 'event-images', finalFileName);
    
    // Delete old banner if exists
    if (existsSync(finalPath)) {
      await unlink(finalPath);
    }

    // Move temp to final
    await rename(tempPath, finalPath);

    const finalRelativePath = `/event-images/${finalFileName}`;
    const imageUrl = req.body.imageUrl;

    // Now update database with final path
    await prisma.event.update({
      where: { id: eventId },
      data: {
        generatedBannerPath: finalRelativePath,
        generatedBannerUrl: imageUrl,
      },
    });

    res.json({ 
      success: true,
      imagePath: finalRelativePath, 
      imageUrl 
    });
  } catch (error) {
    console.error('Error accepting banner:', error);
    res.status(500).json({ error: 'Failed to accept banner' });
  }
};

// Export all controller functions
module.exports = {
  event_index_student,
  event_index_organizer,
  event_new_form,
  event_details_student,
  event_details_organizer,
  event_export_attendees,
  event_create,
  event_delete,
  event_publish,
  event_unpublish,
  event_ics,
  event_generate_image,
  event_accept_banner
};

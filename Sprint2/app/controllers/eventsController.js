/**
 * EVENT CONTROLLERS
 * Handles all logic for event operations
 * Each function corresponds to a route and handles the request/response cycle
 */

const prisma = require('../lib/prisma');
const { validateEventData, wantsJson } = require('../utils/validation');
const { MESSAGES, DEFAULTS } = require('../utils/constants');

/**
 * OLD GET /events - List all published events (student view)
 
const event_index_student = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { published: true },
      orderBy: { startsAt: "asc" },
      include: {
        organizer: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { tickets: true } }
      }
    });
    return res.render('student/index', { events });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};
*/

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

    /**@type {(import('generated-prisma/client')).Prisma.EventWhereInput}*/
    const where = {

      //default
      published: true,

      //Date filters
      ...(from || to 
        ? {
            startsAt: {
              ...(from ? {gte: from} : {}),
              ...(to ? {ite: to} : {}),
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
      return res.json({date: events, meta});
    }

    //pass meta so the view shows filter state
    return res.render('student/index', {events, meta});
  } catch (error) {
    console.error('Error fetching events with filters:', error);
    return res.status(500).json({error: 'Failed to fetch events'});
  }
}

/**
 * GET /events/:id/ics — Download an ICS calendar file for a published event
 */
const event_ics = async (req, res) => {
  try {

    //load published event
    const ev = await prisma.event.findFirst({
      where: {id: req.params.id, published: true},
      select: {
        id:true,
        title:true,
        description:true,
        startsAt: true,
        endsAt: true,
        location: true,
      },
    });


    //throws 400 if event not loaded (not found or not published)
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
          .replace(/,/g, '\\')
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
      where: { id: req.params.id, published: true },
      include: {
        organizer: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { tickets: true } },
      }
    });
    
    if (!event) {
      return res.status(404).json({ error: MESSAGES.EVENT_NOT_FOUND });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Error fetching event details:', error);
    res.status(500).json({ error: "Failed to fetch event details" });
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
      include: { _count: { select: { tickets: true } } },
      orderBy: { createdAt: 'desc' }
    });

    return res.render("organizer/index", { events, organizerId });
  } catch (error) {
    console.error('Error fetching organizer events:', error);
    res.status(500).json({ error: 'Failed to fetch your events' });
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
    
    return res.render("organizer/show", {
      organizerId,
      event,
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

// Export all controller functions
module.exports = {
  event_index_student,
  event_index_organizer,
  event_new_form,
  event_details_student,
  event_details_organizer,
  event_create,
  event_delete,
  event_publish,
  event_unpublish,
  event_ics
};
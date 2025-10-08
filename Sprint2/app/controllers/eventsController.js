// event_index, event_details, event_create, event_delete, event_publish
const { PrismaClient } = require("generated-prisma/client");
const prisma = new PrismaClient();

//This event index is specifically for the user facing event index. See organizer controller for the organizer event index
const event_index_student = async (req, res) => {
	try {
		const events = await prisma.event.findMany({
			where: {published: true},
			orderBy: {startsAt: "asc"},
			include:{
				organizer: {select: {id: true, firstName:true, lastName:true}},
				_count: {select:{tickets:true}}
			}
		})
		res.json(events)
	} catch (error) {
		res.status(500).json({error: 'Failed to fetch events'})
	}
};

const event_index_organizer = async (req, res) => {
	try {
		const organizerId = req.params.id; 
		const events = await prisma.event.findMany({
			where: {organizerId},
			orderBy: {createdAt: "desc"},
		});
		res.json(events);		
	} catch (error) {
		res.status(500).json({error: 'Failed to fetch your created events'});
	}
};

const event_details = async (req, res) => {
	try {
		const event = await prisma.event.findUnique({
			where: {id: req.params.id},
			include:{
				title,
				details,


			}
		})
	} catch (error) {
		
	}

};

const event_create = async (req, res) => {
	try {
		const {title, description, startsAt, endsAt, location, type, capacity, organizerId} = req.body;
		const event = await prisma.event.create({
			data: {
				title,
				description,
				startsAt,
				endsAt,
				location,
				type,
				capacity,
				organizerId,
			},
		});
		res.status(201).json(event);
	} catch (error) {
		console.error(error);
		res.status(400).json({error:"Event creation failed", details: error.message});
	}
};

const event_delete = async (req, res) => {
	try {
		const event = await prisma.event.delete(
			{
				where: {id: req.params.id}
			}
		);
		res.json({message: "Event deleted"});		
	} catch (error) {
		console.error(error);
		res.status(400).json({error: "Event deletion failed"})
	}
};

const event_publish = async (req, res) => {
	try {
		const event = await prisma.event.update(
			{
				where: {id: req.params.id},
				data: {published: true},
			}
		);
		res.json(event)
	} catch (error) {
		console.error(error)
		res.status(400).json({error: "Failed to publish the event"});
	}
};

const event_unpublish = async (req, res) => {
	try {
		const event = await prisma.event.update(
			{
				where: {id: req.params.id},
				data: {published: false},
			}
		);
	} catch (error) {
		console.error(error)
		res.status(400).json({error: "Failed to unpublish the event"});
	}
};
module.exports = {
	event_index_student,
	event_index_organizer,
	event_details,
	event_create,
	event_delete,
	event_publish,
	event_unpublish
};
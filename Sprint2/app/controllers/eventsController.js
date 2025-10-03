// event_index, event_details, event_create, event_delete, event_publish
const { PrismaClient } = require("generated-prisma/client");
const prisma = new PrismaClient();

const event_index = (req, res) => {

}

const event_details = () => {

}

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

const event_delete = () => {

}

const event_publish = async (req, res) => {
	try {
		const event = await prisma.event.update(
			{
				where: {id: req.params.id},
				data: {published: true},
			}
		);
	} catch (error) {
		console.error(error)
		res.status(400).json({error: "Failed to publish the event"});
	}
};

module.exports = {
	event_index,
	event_details,
	event_create,
	event_delete,
	event_publish
};
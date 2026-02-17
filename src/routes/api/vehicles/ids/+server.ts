import { MongoClient, ServerApiVersion } from 'mongodb';
import { PASSWORD } from '$env/static/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const uri = `mongodb+srv://admin:${PASSWORD}@vehicles.irxpojv.mongodb.net/?appName=Vehicles`;

let cachedClient: MongoClient | null = null;
let connectPromise: Promise<MongoClient> | null = null;

async function getMongoClient(): Promise<MongoClient> {
	if (cachedClient) return cachedClient;

	if (!connectPromise) {
		const client = new MongoClient(uri, {
			serverApi: {
				version: ServerApiVersion.v1,
				strict: true,
				deprecationErrors: true
			}
		});

		connectPromise = client.connect().then(() => {
			cachedClient = client;
			return client;
		});
	}

	return connectPromise;
}

export const GET: RequestHandler = async () => {
	const client = await getMongoClient();
	const collection = client.db('main').collection('Vehicles');

	const rows = await collection
		.aggregate([
			{ $match: { vehicleID: { $type: 'string', $ne: '' }, agency: { $type: 'string', $ne: '' } } },
			{ $group: { _id: { vehicleID: '$vehicleID', agency: '$agency' } } },
			{ $project: { _id: 0, vehicleID: '$_id.vehicleID', agency: '$_id.agency' } },
			{ $sort: { agency: 1, vehicleID: 1 } }
		])
		.toArray();

	return json(rows);
};

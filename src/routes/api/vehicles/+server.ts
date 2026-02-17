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

export const GET: RequestHandler = async ({ url }) => {
	const client = await getMongoClient();
	const collection = client.db('main').collection('Vehicles');

	const vehicleID = url.searchParams.get('vehicleID');
	const agency = url.searchParams.get('agency');

	const query: Record<string, string> = {};
	if (vehicleID) query.vehicleID = vehicleID;
	if (agency) query.agency = agency;

	const records = await collection
		.find(query, {
			projection: { _id: 0, imgURL: 1, location: 1, agency: 1, vehicleID: 1, createdAt: 1 }
		})
		.sort({ createdAt: -1 })
		.toArray();

	return json(records);
};

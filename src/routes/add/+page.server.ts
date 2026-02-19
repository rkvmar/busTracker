import { MongoClient, ServerApiVersion } from 'mongodb';
import { PASSWORD } from '$env/static/private';
import { fail, redirect } from '@sveltejs/kit';

const uri = `mongodb+srv://admin:${encodeURIComponent(PASSWORD)}@vehicles.irxpojv.mongodb.net/?appName=Vehicles`;

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

async function uploadToCatbox(file: File): Promise<string> {
	const form = new FormData();
	form.append('reqtype', 'fileupload');
	form.append('fileToUpload', file, file.name);

	const response = await fetch('https://catbox.moe/user/api.php', {
		method: 'POST',
		body: form
	});

	if (!response.ok) {
		throw new Error(`Catbox upload failed with status ${response.status}`);
	}

	const text = (await response.text()).trim();

	if (!text.startsWith('http')) {
		throw new Error(`Catbox upload failed: ${text}`);
	}

	return text;
}

function parseRequiredString(value: FormDataEntryValue | null, field: string) {
	if (typeof value !== 'string' || !value.trim()) {
		return { error: `${field} is required.` };
	}

	return { value: value.trim() };
}

function parseLatitudeLongitude(
	latValue: FormDataEntryValue | null,
	longValue: FormDataEntryValue | null
) {
	if (typeof latValue !== 'string' || typeof longValue !== 'string') {
		return { error: 'Location is required.' };
	}

	if (!latValue.trim() || !longValue.trim()) {
		return { error: 'Location is required.' };
	}

	const latitude = Number(latValue);
	const longitude = Number(longValue);

	if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
		return { error: 'Invalid location values.' };
	}

	if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
		return { error: 'Location values are out of range.' };
	}

	return { value: [latitude, longitude] as [number, number] };
}

export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const image = formData.get('image');

		if (!(image instanceof File)) {
			return fail(400, { message: 'Image file is required.' });
		}

		if (!image.type.startsWith('image/')) {
			return fail(400, { message: 'Only image uploads are allowed.' });
		}

		const agencyResult = parseRequiredString(formData.get('agency'), 'Agency');
		if ('error' in agencyResult) {
			return fail(400, { message: agencyResult.error });
		}

		const vehicleIdResult = parseRequiredString(formData.get('vehicleID'), 'Vehicle ID');
		if ('error' in vehicleIdResult) {
			return fail(400, { message: vehicleIdResult.error });
		}

		const locationResult = parseLatitudeLongitude(formData.get('lat'), formData.get('long'));
		if ('error' in locationResult) {
			return fail(400, { message: locationResult.error });
		}

		let imageURL: string;

		try {
			imageURL = await uploadToCatbox(image);
		} catch (error) {
			console.error('Catbox upload failed', error);
			return fail(500, { message: 'Image upload failed.' });
		}

		try {
			const client = await getMongoClient();
			const collection = client.db('main').collection('Vehicles');

			await collection.insertOne({
				imgURL: imageURL,
				location: locationResult.value,
				agency: agencyResult.value,
				vehicleID: vehicleIdResult.value,
				createdAt: new Date()
			});
		} catch (error) {
			console.error('Database insert failed', error);
			return fail(500, { message: 'Database insert failed.' });
		}

		throw redirect(
			303,
			`/vehicles/${encodeURIComponent(vehicleIdResult.value)}?agency=${encodeURIComponent(agencyResult.value)}`
		);
	}
};

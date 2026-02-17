<script lang="ts">
	import { enhance } from '$app/forms';

	import { base } from '$app/paths';
	import { onMount } from 'svelte';

	const agencies = [
		'SamTrans',
		'VTA',
		'AC Transit',
		'Muni',
		'Golden Gate Transit',
		'Santa Rosa Citybus',
		'County Connection',
		'The Vine',
		'Sonoma County Transit',
		'Fairfield and Suisun Transit',
		'Caltrain',
		'Wheels',
		'Union City Transit',
		'Tri Delta Transit',
		'Petaluma Transit',
		'SF Bay Ferry',
		'Golden Gate Ferry',
		'SolTrans',
		'Marin Transit',
		'SMART',
		'BART',
		'MVgo',
		'PresidiGo',
		'Dumbarton Express',
		'WestCAT',
		'LINKS',
		'Commute.org',
		'South City Shuttle'
	];

	let lat = '';
	let long = '';
	let imagePreviewUrl = '';

	let submitting = false;
	let submitMessage = '';
	let submitSuccess = false;
	let submitImageURL = '';

	function setLocationFromBrowser() {
		if (!navigator.geolocation) return;

		navigator.geolocation.getCurrentPosition(
			(pos) => {
				lat = pos.coords.latitude.toString();
				long = pos.coords.longitude.toString();
			},
			() => {},
			{ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
		);
	}

	function handleImageChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];

		if (imagePreviewUrl) {
			URL.revokeObjectURL(imagePreviewUrl);
		}

		imagePreviewUrl = file ? URL.createObjectURL(file) : '';
	}

	let enhanceForm = () => {};

	onMount(() => {
		setLocationFromBrowser();

		enhanceForm = enhance(({ form }) => {
			submitting = true;
			submitMessage = '';
			submitSuccess = false;
			submitImageURL = '';

			return async ({ result, update }) => {
				submitting = false;

				if (result.type === 'redirect') {
					window.location.assign(result.location);
					return;
				}

				if (result.type === 'success') {
					submitSuccess = true;
					submitMessage = 'Upload complete.';
					submitImageURL = result.data?.imgURL ?? '';
					form.reset();
					if (imagePreviewUrl) {
						URL.revokeObjectURL(imagePreviewUrl);
					}
					imagePreviewUrl = '';
					const uploadedVehicleID = result.data?.vehicleID;
					const uploadedAgency = result.data?.agency;
					if (uploadedVehicleID && uploadedAgency) {
						window.location.assign(
							`${base}/vehicles/${encodeURIComponent(uploadedVehicleID)}?agency=${encodeURIComponent(uploadedAgency)}`
						);
					} else if (uploadedVehicleID) {
						window.location.assign(`${base}/vehicles/${encodeURIComponent(uploadedVehicleID)}`);
					}
				} else if (result.type === 'failure') {
					submitSuccess = false;
					submitMessage = result.data?.message ?? 'Upload failed. Please try again.';
				} else if (result.type === 'error') {
					submitSuccess = false;
					submitMessage = result.error?.message ?? 'Unexpected error. Please try again.';
				}

				await update();
			};
		});
	});
</script>

<svelte:head>
	<title>Add Vehicle Photo</title>
</svelte:head>

<main class="page">
	<header class="header">
		<button class="back-link" type="button" on:click={() => window.location.assign(`${base}/`)}>
			← Back to map
		</button>
		<h1>Add Vehicle Photo</h1>
	</header>

	<form method="POST" enctype="multipart/form-data" use:enhanceForm>
		<fieldset>
			<legend>Vehicle Photo</legend>
			<label>
				<span>Capture or Upload Image</span>
				<input
					type="file"
					name="image"
					accept="image/*"
					capture="environment"
					required
					on:change={handleImageChange}
				/>
			</label>
			{#if imagePreviewUrl}
				<img class="preview" src={imagePreviewUrl} alt="Selected bus" />
			{/if}
		</fieldset>

		<fieldset>
			<legend>Vehicle Details</legend>

			<label>
				<span>Agency</span>
				<select name="agency" required>
					<option value="" disabled selected>Select an agency</option>
					{#each agencies as agency}
						<option value={agency}>{agency}</option>
					{/each}
				</select>
			</label>

			<label>
				<span>Vehicle ID</span>
				<input type="text" name="vehicleID" placeholder="e.g. 7213" required />
			</label>
		</fieldset>

		<input type="hidden" name="lat" bind:value={lat} />
		<input type="hidden" name="long" bind:value={long} />

		<div class="actions">
			<button type="submit" class="primary" disabled={submitting}>
				{submitting ? 'Uploading…' : 'Upload'}
			</button>
			{#if submitMessage}
				<p class:success={submitSuccess} class:error={!submitSuccess}>{submitMessage}</p>
			{/if}
			{#if submitImageURL}
				<p class="success">
					Image URL:
					<a href={submitImageURL} target="_blank" rel="noreferrer">{submitImageURL}</a>
				</p>
			{/if}
		</div>
	</form>
</main>

<style>
	:global(body) {
		margin: 0;
		font-family:
			system-ui,
			-apple-system,
			Segoe UI,
			Roboto,
			sans-serif;
		background: #0b1020;
		color: #e7ecf4;
	}

	.page {
		max-width: 720px;
		margin: 0 auto;
		padding: 32px 20px 48px;
	}

	.header {
		display: grid;
		gap: 8px;
		margin-bottom: 24px;
	}

	.back-link {
		color: #93c5fd;
		text-decoration: none;
		font-size: 0.9rem;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		font: inherit;
		text-align: left;
	}

	h1 {
		margin: 0;
		font-size: 2rem;
	}

	.subtitle {
		margin: 0;
		color: #b5c2d9;
	}

	form {
		display: grid;
		gap: 20px;
	}

	fieldset {
		border: 1px solid #22304d;
		border-radius: 12px;
		padding: 16px;
		background: #11172b;
	}

	legend {
		padding: 0 8px;
		color: #cfe0ff;
	}

	label {
		display: grid;
		gap: 6px;
		margin-bottom: 12px;
	}

	input,
	select {
		padding: 10px 12px;
		border-radius: 10px;
		border: 1px solid #2b3d63;
		background: #0c1324;
		color: #e7ecf4;
	}

	.preview {
		width: 100%;
		max-height: 320px;
		object-fit: cover;
		border-radius: 12px;
		border: 1px solid #22304d;
	}

	.actions {
		display: grid;
		gap: 8px;
	}

	button.primary {
		padding: 10px 14px;
		border-radius: 10px;
		border: 1px solid #2b3d63;
		background: #2563eb;
		color: white;
		cursor: pointer;
		font-weight: 600;
	}

	button.primary:hover {
		filter: brightness(1.1);
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.error {
		color: #ff9aa2;
		margin: 0;
	}

	.success {
		color: #8ee0a1;
		margin: 0;
	}
</style>

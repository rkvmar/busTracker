<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';

	let loading = true;
	let errorMessage = '';
	let vehicles: { vehicleID: string; agency: string }[] = [];
	let searchQuery = '';
	$: normalizedQuery = searchQuery.trim().toLowerCase();
	$: filteredVehicles = normalizedQuery
		? vehicles.filter((vehicle) => {
				const id = vehicle.vehicleID.toLowerCase();
				const agency = vehicle.agency.toLowerCase();
				return id.includes(normalizedQuery) || agency.includes(normalizedQuery);
			})
		: vehicles;

	async function loadVehicles() {
		loading = true;
		errorMessage = '';
		try {
			const response = await fetch(`${base}/api/vehicles/ids`);
			if (!response.ok) {
				throw new Error(`Failed to load vehicles: ${response.status}`);
			}
			const items = (await response.json()) as { vehicleID: string; agency: string }[];
			vehicles = items;
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to load vehicles.';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadVehicles();
	});
</script>

<svelte:head>
	<title>Vehicle List</title>
</svelte:head>

<main class="page">
	<header class="header">
		<a class="back-link" href={`${base}/`}>← Back to map</a>
		<h1>Vehicles</h1>
	</header>

	<div class="search">
		<input
			type="search"
			placeholder="Search by vehicle ID or agency"
			bind:value={searchQuery}
			aria-label="Search vehicles"
		/>
	</div>

	{#if loading}
		<p class="status">Loading vehicles…</p>
	{:else if errorMessage}
		<p class="error">{errorMessage}</p>
	{:else if filteredVehicles.length === 0}
		<p class="status">
			{#if searchQuery}
				No vehicles match "{searchQuery}".
			{:else}
				No vehicles found yet.
			{/if}
		</p>
	{:else}
		<ul class="list">
			{#each filteredVehicles as vehicle}
				<li>
					<a
						class="vehicle-link"
						href={`${base}/vehicles/${encodeURIComponent(vehicle.vehicleID)}?agency=${encodeURIComponent(vehicle.agency)}`}
					>
						<div class="vehicle-meta">
							<span class="id">{vehicle.vehicleID}</span>
							<span class="agency">{vehicle.agency}</span>
						</div>
						<span class="chevron">→</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
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
	}

	h1 {
		margin: 0;
		font-size: 2rem;
	}

	.subtitle {
		margin: 0;
		color: #b5c2d9;
	}

	.search {
		margin-bottom: 16px;
	}

	.search input {
		width: 100%;
		padding: 12px 14px;
		border-radius: 12px;
		border: 1px solid #22304d;
		background: #11172b;
		color: #e7ecf4;
		font-size: 0.95rem;
	}

	.search input::placeholder {
		color: #8fa2c7;
	}

	.status {
		color: #a7b3c9;
		margin: 0;
	}

	.error {
		color: #ff9aa2;
		margin: 0;
	}

	.list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 12px;
	}

	.vehicle-link {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 14px 16px;
		border-radius: 12px;
		border: 1px solid #22304d;
		background: #11172b;
		color: #e7ecf4;
		text-decoration: none;
	}

	.vehicle-meta {
		display: grid;
		gap: 2px;
	}

	.vehicle-link:hover {
		border-color: #3b82f6;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
	}

	.id {
		font-weight: 600;
	}

	.agency {
		color: #b5c2d9;
		font-size: 0.8rem;
	}

	.chevron {
		color: #93c5fd;
		font-size: 1.1rem;
	}
</style>

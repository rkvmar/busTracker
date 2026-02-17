<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let mapContainer: HTMLDivElement | null = null;
	let loadError = '';
	let loading = true;
	let mapReady = false;
	let lightboxUrl = '';
	let lightboxAlt = '';

	function openLightbox(url: string, alt: string) {
		lightboxUrl = url;
		lightboxAlt = alt;
	}

	function closeLightbox() {
		lightboxUrl = '';
		lightboxAlt = '';
	}

	function handlePopupClick(event: Event) {
		const target = event.target as HTMLElement | null;
		if (!(target instanceof HTMLImageElement)) return;
		const full = target.dataset.full;
		if (!full) return;
		openLightbox(full, target.alt || 'Image');
	}

	type VehicleRecord = {
		imgURL: string;
		location: [number, number];
		agency: string;
		vehicleID: string;
		createdAt?: string;
	};

	let vehicleID = '';
	let agency = '';
	$: vehicleID = $page.params.vehicleID;
	$: agency = $page.url.searchParams.get('agency') ?? '';

	let map: any;
	let clusterGroup: any;

	function loadScript(src: string) {
		return new Promise<void>((resolve, reject) => {
			const existing = document.querySelector(`script[src="${src}"]`);
			if (existing) {
				resolve();
				return;
			}
			const script = document.createElement('script');
			script.src = src;
			script.async = true;
			script.onload = () => resolve();
			script.onerror = () => reject(new Error(`Failed to load ${src}`));
			document.body.appendChild(script);
		});
	}

	function loadStylesheet(href: string) {
		const existing = document.querySelector(`link[href="${href}"]`);
		if (existing) return;
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = href;
		document.head.appendChild(link);
	}

	async function initMap() {
		try {
			loadStylesheet('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
			loadStylesheet('https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css');
			loadStylesheet(
				'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css'
			);

			await loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
			await loadScript(
				'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js'
			);

			if (!mapContainer) return;

			const L = (window as unknown as { L: any }).L;

			map = L.map(mapContainer, {
				zoomControl: true
			}).setView([37.7749, -122.4194], 9);

			L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
				maxZoom: 19
			}).addTo(map);

			clusterGroup = L.markerClusterGroup();
			map.addLayer(clusterGroup);

			mapReady = true;
			await loadVehicleRecords();
		} catch (error) {
			loadError = error instanceof Error ? error.message : 'Failed to load map.';
		}
	}

	async function loadVehicleRecords() {
		if (!mapReady || !vehicleID) return;

		loading = true;
		loadError = '';

		try {
			const params = new URLSearchParams({ vehicleID });
			if (agency) params.set('agency', agency);
			const response = await fetch(`${base}/api/vehicles?${params.toString()}`);
			if (!response.ok) {
				throw new Error(`Failed to load data: ${response.status}`);
			}

			const records: VehicleRecord[] = await response.json();

			clusterGroup.clearLayers();

			for (const record of records) {
				if (!record.location || record.location.length !== 2) continue;

				const [lat, lng] = record.location;
				const marker = (window as unknown as { L: any }).L.marker([lat, lng]);

				const createdAt = record.createdAt ? new Date(record.createdAt).toLocaleString() : '';
				const popupHtml = `
					<div class="popup">
						<img src="${record.imgURL}" alt="Vehicle" class="popup-image" data-full="${record.imgURL}" />
						<div class="meta">
							${createdAt ? `<div>${createdAt}</div>` : ''}
						</div>
					</div>
				`;

				marker.bindPopup(popupHtml, { maxWidth: 240 });
				clusterGroup.addLayer(marker);
			}

			if (records.length > 0) {
				const bounds = clusterGroup.getBounds();
				if (bounds.isValid()) {
					map.fitBounds(bounds, { padding: [32, 32] });
				}
			}
		} catch (error) {
			loadError = error instanceof Error ? error.message : 'Failed to load vehicle records.';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		initMap();

		const container = mapContainer;
		if (container) {
			container.addEventListener('click', handlePopupClick);
		}

		return () => {
			if (container) {
				container.removeEventListener('click', handlePopupClick);
			}
		};
	});

	$: if (mapReady && vehicleID) {
		loadVehicleRecords();
	}
</script>

<svelte:head>
	<title>Vehicle {vehicleID}</title>
</svelte:head>

<main class="page">
	<header class="header">
		<a class="back-link" href={`${base}/vehicles`}>← Back to vehicles</a>
		<h1>
			{#if agency}{agency}{/if}
			{vehicleID}
		</h1>
	</header>

	<div class="map" bind:this={mapContainer}></div>

	{#if loading}
		<div class="status">Loading map data…</div>
	{/if}

	{#if loadError}
		<div class="error-banner">{loadError}</div>
	{/if}

	{#if lightboxUrl}
		<div class="lightbox" on:click={closeLightbox}>
			<img src={lightboxUrl} alt={lightboxAlt} />
		</div>
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
		position: relative;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
	}

	.header {
		position: absolute;
		top: 16px;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(11, 16, 32, 0.9);
		border: 1px solid #22304d;
		border-radius: 12px;
		padding: 12px 16px;
		display: grid;
		gap: 4px;
		z-index: 1000;
		min-width: 260px;
	}

	.back-link {
		color: #93c5fd;
		text-decoration: none;
		font-size: 0.85rem;
	}

	h1 {
		margin: 0;
		font-size: 1.2rem;
	}

	.subtitle {
		margin: 0;
		color: #b5c2d9;
		font-size: 0.9rem;
	}

	.map {
		width: 100%;
		height: 100%;
		z-index: 0;
	}

	.status {
		position: absolute;
		bottom: 24px;
		left: 50%;
		transform: translateX(-50%);
		background: #1f2937;
		color: #e5e7eb;
		padding: 8px 14px;
		border-radius: 999px;
		border: 1px solid #374151;
	}

	.error-banner {
		position: absolute;
		bottom: 24px;
		left: 50%;
		transform: translateX(-50%);
		background: #1f2937;
		color: #fca5a5;
		padding: 10px 16px;
		border-radius: 999px;
		border: 1px solid #374151;
	}

	:global(.popup) {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 8px;
		min-width: 100px;
	}

	:global(.popup img) {
		width: 100%;
		border-radius: 8px;
		display: block;
		cursor: zoom-in;
	}

	.lightbox {
		position: fixed;
		inset: 0;
		background: rgba(11, 16, 32, 0.9);
		display: grid;
		place-items: center;
		z-index: 2000;
		padding: 24px;
	}

	.lightbox img {
		max-width: min(960px, 92vw);
		max-height: 88vh;
		border-radius: 12px;
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
	}

	:global(.popup .meta) {
		font-size: 12px;
		color: #111827;
	}
</style>

<script lang="ts">
	import { onMount } from 'svelte';
	import Nav from '$lib/components/Nav.svelte';

	let mapContainer: HTMLDivElement | null = null;
	let loadError = '';
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

			const map = L.map(mapContainer, {
				zoomControl: true
			}).setView([37.7749, -122.4194], 9);

			L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
				maxZoom: 19
			}).addTo(map);

			const clusterGroup = L.markerClusterGroup();

			const response = await fetch('/api/vehicles');
			if (!response.ok) {
				throw new Error(`Failed to load data: ${response.status}`);
			}

			const records: VehicleRecord[] = await response.json();

			for (const record of records) {
				if (!record.location || record.location.length !== 2) continue;

				const [lat, lng] = record.location;
				const marker = L.marker([lat, lng]);
				const createdAt = record.createdAt ? new Date(record.createdAt).toLocaleString() : '';

				const popupHtml = `
					<div class="popup">
						<img src="${record.imgURL}" alt="Vehicle" class="popup-image" data-full="${record.imgURL}" />
						<div class="meta">
						    <div><strong>${record.agency} ${record.vehicleID}</strong></div>
							${createdAt ? `<div>${createdAt}</div>` : ''}
						</div>
					</div>
				`;

				marker.bindPopup(popupHtml, { maxWidth: 240 });
				clusterGroup.addLayer(marker);
			}

			map.addLayer(clusterGroup);

			if (records.length > 0) {
				const bounds = clusterGroup.getBounds();
				if (bounds.isValid()) {
					map.fitBounds(bounds, { padding: [32, 32] });
				}
			}
		} catch (error) {
			loadError = error instanceof Error ? error.message : 'Failed to load map.';
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
</script>

<svelte:head>
	<title>Vehicles</title>
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,600,0,0"
	/>
</svelte:head>

<main class="page">
	<div class="map" bind:this={mapContainer}></div>

	{#if loadError}
		<div class="error-banner">{loadError}</div>
	{/if}

	<Nav></Nav>

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

	.map {
		width: 100%;
		height: 100%;
		z-index: 0;
	}

	.error-banner {
		position: absolute;
		top: 16px;
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
		height: auto;
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

<nav class="bottom-nav" aria-label="Primary">
	<a class="nav-item" href="/vehicles">
		<span class="material-symbols-rounded">directions_bus</span>
		<span class="label">Vehicles</span>
	</a>
	<a class="nav-item" href="/add">
		<span class="material-symbols-rounded">add</span>
		<span class="label">Add</span>
	</a>
</nav>

<style>
	.bottom-nav {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		justify-content: space-around;
		gap: 8px;
		padding: 10px 16px 18px;
		background: rgba(11, 16, 32, 0.95);
		border-top: 1px solid #22304d;
		z-index: 1000;
	}

	.nav-item {
		display: grid;
		justify-items: center;
		gap: 4px;
		color: #e7ecf4;
		text-decoration: none;
		font-size: 0.85rem;
		padding: 6px 12px;
		border-radius: 12px;
		width: 50px;
	}

	.nav-item .material-symbols-rounded {
		font-size: 24px;
	}

	.nav-item .label {
		font-size: 0.75rem;
		color: #b5c2d9;
	}

	.nav-item:hover {
		background: rgba(37, 99, 235, 0.15);
	}
</style>

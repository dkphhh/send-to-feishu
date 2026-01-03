<script lang="ts">
	import DonateImg from '@/assets/Donate.webp';

	let modalElement: HTMLDialogElement;
</script>

<button
	onclick={() => {
		modalElement.showModal();
	}}
	class="btn fixed right-2 bottom-2 btn-soft btn-success hover:-translate-x-2 hover:-translate-y-2 hover:scale-110"
>
	🤑 打赏作者
</button>

<dialog bind:this={modalElement} class="modal">
	<div class="modal-box">
		<h3 class="text-lg font-bold">Buy me a coffee ☕️</h3>
		<p class="py-4 text-base">一块一角也是情，一分一厘也是爱❤️</p>
		<img src={DonateImg} alt="微信付款码" />
		<div class="modal-action">
			<form method="dialog">
				<button class="btn">关闭</button>
			</form>
		</div>
	</div>
</dialog>

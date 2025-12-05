/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Snippet } from 'svelte';
/**
 * 通知消息对象的接口描述。
 *
 * 表示用于在应用中展示短时通知（如 toast、snackbar 等）的数据结构，
 * 包含渲染通知所需的基本信息和可选设置。
 *
 * @remarks
 * - 用于在 UI 中统一描述一条通知的内容、样式语义、可见性及持续时间。
 *
 * @property message - 要显示的文本消息内容，这里是 svelte 组件。用户可以自己编辑一段 {#snippt} 文本放进去，建议用 span 或者 p 标签包裹消息内容。
 * @example {#snippet susccessMessage(url:string)} {/snippet}
 * @property type - 通知类型，可选值："info" | "success" | "error" | "warning"，用于决定展示样式或语义。
 * @property visible - 当前通知是否可见；true 表示应显示，false 表示应隐藏。
 * @property duration - 可选，通知显示的持续时间，单位为毫秒（ms）。未指定时由调用方或框架决定默认行为（例如永久显示或使用全局默认值）。
 */
export interface NotificationMessage {
	message: Snippet<[any]> | undefined;
	props?: any;
	type?: 'info' | 'success' | 'error' | 'warning';
	visible: boolean;
	duration?: number;
}

/**
 * 表示用于创建或发送新通知的消息类型，包含 NotificationMessage 的所有字段，但移除了 "visible" 字段。
 *
 * 用途：
 * - 当通知的可见性由外部控制（例如 UI 状态、通知管理器或调度逻辑）时使用此类型。
 * - 避免在创建时显式设置可见性，由接收方根据上下文决定何时展示通知。
 *
 * 关系：
 * - 基于 NotificationMessage，但省略了 "visible" 属性（等同于 Omit<NotificationMessage, "visible">）。
 *
 * 示例：
 * const msg: NewNotificationMessage = {
 *   title: "操作成功",
 *   body: "您的文件已上传完成",
 *   level: "info"
 * };
 *
 * 备注：
 * - 如果需要在创建时就确定可见性，请使用原始的 NotificationMessage 或在通知创建后由管理器附加可见性信息。
 *
 * @see NotificationMessage
 */
export type NewNotificationMessage = Omit<NotificationMessage, 'visible'>;

/**
 * 通知管理器类。
 *
 * @class NotificationManager
 * @implements {NotificationMessage}
 *
 * 该类负责在应用程序中管理和显示通知消息。
 * 它使用 Svelte 5 的 runes (`$state`, `$effect`) 来实现响应式状态管理。
 *
 * @property {Snippet<[unknown]>} message - 通知的内容。
 * @property {"info" | "success" | "error" | "warning"} type - 通知的类型，默认为 "info"。
 * @property {boolean} visible - 控制通知的可见性。
 * @property {number} duration - 通知显示的持续时间（以毫秒为单位），默认为 3000ms。
 */
class NotificationManager implements NotificationMessage {
	message: Snippet<[any]> | undefined = $state();
	props: any = $state();
	type: 'info' | 'success' | 'error' | 'warning' = $state('info');
	visible: boolean = $state(false);
	duration: number = $state(3000); // in ms

	/**
	 * 发送并显示一条新的通知。
	 *
	 * @method sentMessage
	 * @param {NewNotificationMessage} newMessage - 包含新通知信息的对象。
	 * @property {Snippet<[unknown[]]> | undefined;} newMessage.message - 新通知的内容。
	 * @property {unknown} [newMessage.props] - (可选) 传递给 message snippet 的参数。
	 * @property {"info" | "success" | "error" | "warning"} [newMessage.type] - (可选) 新通知的类型。
	 * @property {number} [newMessage.duration] - (可选) 新通知的显示时长，单位：毫秒，1 秒=1000 毫秒。
	 */
	sentMessage(newMessage: NewNotificationMessage) {
		this.message = newMessage.message;
		this.props = newMessage.props;
		if (newMessage.type) this.type = newMessage.type;
		if (newMessage.duration) this.duration = newMessage.duration;
		this.visible = true;

		// 自动关闭通知
		setTimeout(() => {
			this.closeMessage();
		}, this.duration);
	}
	/**
	 * 关闭当前显示的通知。
	 *
	 * @method closeMessage
	 * 该方法会将通知设置为不可见，并重置其图标、消息和类型状态。
	 */
	closeMessage() {
		this.visible = false;
		this.message = undefined;
		this.props = undefined;
		this.type = 'info';
	}
}

export const notificationManager = new NotificationManager();

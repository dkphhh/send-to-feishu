declare global {
	type FeishuApiResponse<T = Record<string, unknown>> = {
		/**
		 * 飞书返回的状态码，0 代表成功
		 */
		code: number;
		/**
		 * 飞书返回的错误信息
		 */
		msg: string;
		/**
		 * 飞书返回的数据，具体结构根据不同接口有所不同
		 */
		data: T;
	};

	/**
	 * 抓取网页文章的类型
	 *
	 */
	interface FetchedArticle {
		/**
		 * 文章的标题
		 *
		 * @type {string}
		 */
		title: string;

		/**
		 * 文章作者
		 *
		 * @type {string}
		 */
		author: string;

		/**
		 * 文章描述
		 *
		 * @type {string}
		 */
		description: string;
		/**
		 * 文章的发布时间
		 *
		 * @type {string}
		 */
		published: string;

		/**
		 * 文章的来源
		 *
		 * @type {string}
		 */
		source: string;
		/**
		 * 文章链接
		 *
		 * @type {string}
		 */
		url: string;

		/**
		 * 文章的内容，markdown 格式
		 *
		 * @type {string}
		 */
		content: string;
	}
	type FetchedArticleField = Exclude<keyof FetchedArticle, 'content'>;

	type SheetRangeIndex = { startIndex: string; endIndex: string };

	interface BaseFormType {
		/**
		 *  配置 id
		 */
		id: string;
		/**
		 *  配置名称
		 */
		name: string;
		/**
		 * 图标，只能输入一个字符
		 */
		icon: string;
		/**
		 * 表单类型名称
		 */
		formType: '电子表格' | '多维表格' | '飞书文档';
	}
	interface SheetFormTypeBase extends BaseFormType {
		formType: '电子表格';
		sheetToken: string;
		sheetId: string;
		rangeIndex: SheetRangeIndex;
		fields: FetchedArticleField[];
	}

	type SheetFormWithDoc = SheetFormTypeBase & {
		linkDocFormId: string;
		fields: (FetchedArticleField | 'feishuDocUrl')[];
	};

	type SheetFormWithoutDoc = SheetFormTypeBase & {
		linkDocFormId?: undefined;
	};

	type SheetFormType = SheetFormWithDoc | SheetFormWithoutDoc;

	interface BitableFieldOption {
		id: string;
		name: string;
		color?: number;
	}

	interface BitableManualField {
		id: string;
		label: string;
		columnId: string;
		columnName: string;
		type: number;
		options?: BitableFieldOption[];
	}

	type BitableFieldsMapWithoutDoc = Record<
		FetchedArticleField,
		{ name: string; type: number; id: string } | undefined
	>;

	type BitableFieldsMapWithDoc = Record<
		FetchedArticleField | 'feishuDocUrl',
		{ name: string; type: number; id: string } | undefined
	>;

	interface BitableFormBase extends BaseFormType {
		/**
		 * 表单类型名称
		 */
		formType: '多维表格';
		/**
		 * 多维表格的 token。
		 */
		appToken: string;
		/**
		 * 多维表格的数据表的 ID。
		 */
		tableId: string;
		/**
		 * 手动填写的业务字段配置
		 */
		manualFields?: BitableManualField[];
	}

	type BitableFormWithDoc = BitableFormBase & {
		/**
		 * 关联的飞书文档配置 ID，如果有，会将文章内容保存到飞书文档。
		 */
		linkDocFormId: string;
		fieldsMap: BitableFieldsMapWithDoc;
	};

	type BitableFormWithoutDoc = BitableFormBase & {
		linkDocFormId?: undefined;
		fieldsMap: BitableFieldsMapWithoutDoc;
	};

	type BitableFormType = BitableFormWithDoc | BitableFormWithoutDoc;

	interface DocFromType extends BaseFormType {
		/**
		 * 表单类型名称
		 */
		formType: '飞书文档';
		/**
		 * 指定飞书文件夹的 token, 不传表示上传到根目录。
		 */
		folderToken: string;
	}

	type FormType = SheetFormType | BitableFormType | DocFromType;

	type Forms = FormType[];

	type FormTypeName = FormType['formType'];
	type EditMode = 'create' | 'edit';
	type PageType = 'index' | 'settings' | 'formList' | 'formEdit' | 'formCreate' | 'save';
}

export {};

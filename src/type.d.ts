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
		 * 文章的保存时间
		 */
		saveAt: string;
		/**
		 * 文章的内容，markdown 格式
		 *
		 * @type {string}
		 */
		content: string;
	}
	type FetchedArticleField = Exclude<keyof FetchedArticle, 'content'>;

	type SheetRangeIndex = { startIndex: string; endIndex: string };

	interface SheetGridProperties {
		frozen_row_count: number;
		frozen_column_count: number;
		row_count: number;
		column_count: number;
	}

	interface SheetMergeRange {
		start_row_index: number;
		end_row_index: number;
		start_column_index: number;
		end_column_index: number;
	}

	interface SheetItem {
		sheet_id: string;
		title: string;
		index: number;
		hidden: boolean;
		grid_properties?: SheetGridProperties;
		resource_type: 'sheet' | 'bitable' | '#UNSUPPORTED_TYPE';
		merges?: SheetMergeRange[];
	}

	type GetSpreadsheetsDataResponse = FeishuApiResponse<{
		sheets: SheetItem[];
	}>;

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
		formType: '电子表格' | '多维表格' | '飞书文档' | '保存到本地';
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

	type BitableFieldsMapWithoutDoc = Record<
		FetchedArticleField,
		{ name: string; type: number } | undefined
	>;

	type BitableFieldsMapWithDoc = Record<
		FetchedArticleField | 'feishuDocUrl',
		{ name: string; type: number } | undefined
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
	}

	interface DownLoadMarkdownFormType extends BaseFormType {
		/**
		 * 表单类型名称
		 */
		formType: '保存到本地';

		/**
		 * 保存到文章开头的 YAML 字段
		 */
		fields: FetchedArticleField[];

		/**
		 * 保存的文件名模板
		 */
		fileNameTemplate: (FetchedArticleField | 'customString')[];

		/**
		 * 自定义文件名字符串
		 */
		customFileNameString: string;
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

	type FormType = SheetFormType | BitableFormType | DocFromType | DownLoadMarkdownFormType;

	type Forms = FormType[];

	type FormTypeName = FormType['formType'];
	type EditMode = 'create' | 'edit';
	type PageType = 'index' | 'settings' | 'formList' | 'formEdit' | 'formCreate' | 'save';
}

export { };

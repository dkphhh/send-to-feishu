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
	type FetchedArticleFields = Exclude<keyof FetchedArticle, 'content'>;

	type SheetRangeIndex = { startIndex: string; endIndex: string };

	type SheetFormType = {
		/**
		 *  配置 id
		 */
		id: string;
		/**
		 *  配置名称
		 */
		name: string;
		/**
		 * 表单类型名称
		 */
		formType: '飞书表格';
		/**
		 * 电子表格的 token。
		 */
		sheetToken: string;
		/**
		 * 电子表格工作表的 ID。
		 */
		sheetId: string;
		/**
		 * 电子表格工作表的范围索引。
		 */
		rangeIndex: SheetRangeIndex;
		/**
		 * 包含的字段
		 */
		fields: FetchedArticleFields[];
	};

	type BitableFormType = {
		/**
		 *  配置 id
		 */
		id: string;
		/**
		 *  配置名称
		 */
		name: string;
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
		 * 包含的字段映射关系
		 * key: 抓取的文章字段
		 * value: 飞书多维表格的字段
		 */
		fieldsMap: Record<FetchedArticleFields, string|undefined>;
	};

	type DocFromType = {
		/**
		 *  配置 id
		 */
		id: string;
		/**
		 *  配置名称
		 */
		name: string;
		/**
		 * 表单类型名称
		 */
		formType: '飞书文档';
		/**
		 * 指定飞书文件夹的 token。
		 */
		folderToken: string;
	};

	type UnionFormType = {
		/**
		 *  配置 id
		 */
		id: string;
		/**
		 *  配置名称
		 */
		name: string;
		formType: '联动配置';
		linkForm: SheetFormType | BitableFormType;
		docForm: DocFromType;
	};

	type FormType = SheetFormType | BitableFormType | DocFromType | UnionFormType;

	type Forms = FormType[];

	type FormTypeName = FormType['formType'];
	type EditMode = 'create' | 'edit';
	type PageType = 'index' | 'settings' | 'formList' | 'formEdit';
}

export {};

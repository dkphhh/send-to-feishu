import { credentials } from '@/components/settings/settings.svelte';

type NodeType = 'bitable' | 'sheet' | 'docx';
type PathName = 'wiki' | 'docx' | 'base' | 'sheets';

function pathToNodeType(pathName: PathName): NodeType {
	switch (pathName) {
		case 'base':
			return 'bitable';
		case 'sheets':
			return 'sheet';
		case 'docx':
			return 'docx';
		default:
			throw new Error(`未知的路径名称：${pathName}`);
	}
}

export async function getNodeToken(url: string): Promise<{ token: string; objectType: NodeType }> {
	const baseUrl = credentials.feishuBaseUrl;
	if (!url.startsWith(baseUrl)) {
		throw new Error('多维表格链接不属于当前飞书域名，请检查链接是否正确');
	}

	const urlObj = new URL(url);
	const pathList = urlObj.pathname.split('/');
	const tokenType = pathList[1] as PathName;
	const token = pathList[pathList.length - 1];

	console.log('pathList', pathList);
	console.log('nodeToken', token);

	if (!token) {
		throw new Error('无法从链接中解析出知识结点 Token，请检查链接是否正确');
	}
	// 判断是否是知识结点 token
	if (tokenType !== 'wiki') {
		// 如果不是，直接返回 token 和类型
		return { token, objectType: pathToNodeType(tokenType) };
	}

	// 如果是知识结点 token，则调用飞书接口获取节点信息
	if (credentials.tokenManager === undefined) {
		throw new Error('未找到有效的凭据');
	}

	const apiUrl = `https://open.feishu.cn/open-apis/wiki/v2/spaces/get_node?token=${token}`;

	const headers = {
		Authorization: `Bearer ${await credentials.tokenManager.getToken()}`,
		'Content-Type': 'application/json; charset=utf-8'
	};

	const res = await fetch(apiUrl, {
		method: 'GET',
		headers
	});

	if (!res.ok) {
		throw new Error(`请求获取知识空间节点信息接口失败，${await res.text()}`);
	}

	const resData: FeishuApiResponse<{
		node: {
			obj_token: string;
			obj_type: NodeType;
		};
	}> = await res.json();

	if (resData.code !== 0) {
		throw new Error(`获取知识空间节点信息接口报错：${resData.msg}`);
	}

	return {
		token: resData.data.node.obj_token,
		objectType: resData.data.node.obj_type
	};
}

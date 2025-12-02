const urlObj = new URL(
	'https://yuanwang.feishu.cn/wiki/Xjy0wDCYZi0aSYkZQL7cW5z8nCh?table=tblbe5qlPODl1bGk&view=vewiuL69F3'
);


const pathList = urlObj.pathname.split('/');
const tokenType = pathList[1];
const nodeToken = pathList[pathList.length - 1];

console.log('pathList', pathList);
console.log('nodeToken', nodeToken);

if (!nodeToken) {
	throw new Error('无法从链接中解析出知识结点 Token，请检查链接是否正确');
}
// 判断是否是知识结点 token
if (tokenType === 'wiki') {
	console.log('是知识结点 token');
}

#!/bin/bash

# 打包Chrome扩展为ZIP文件

echo "🚀 开始打包扩展..."

# 确保dist目录存在
if [ ! -d "dist" ]; then
  echo "❌ dist目录不存在，请先运行 npm run build"
  exit 1
fi

# 创建ZIP文件
cd dist
zip -r ../txmeeting-info-extractor-v1.0.0.zip * -x "*.DS_Store"
cd ..

echo "✅ 打包完成！"
echo "📦 文件位置: txmeeting-info-extractor-v1.0.0.zip"
echo ""
echo "下一步:"
echo "1. 测试扩展功能"
echo "2. 准备Chrome Web Store资产（截图、宣传图等）"
echo "3. 访问 https://chrome.google.com/webstore/devconsole 上传"

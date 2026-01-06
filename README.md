<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1Xh296KSTneLD0P_EC2OMS1zfnXPZKIVT

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


用Three.js创建一个实时交互 的3D粒子系统。要求:
1.交互逻辑:手势模式识别（带状态机锁定）：缩放模式 ：五指张开/握拳。控制粒子扩散和颜色爆发。视角旋转：仅伸出食指。基于相机坐标系（非世界坐标）控制 XY 轴旋转。<br/>平面翻转：伸出食指+中指 。计算双指连线的绝对角度变化，控制 Z 轴旋转 (1:1 跟手)。
2.提供U面板可选择爱心/花朵/士星/佛像/烟花等模型
3.支持颜色选择器调整粒子颜色
4.粒子需实时响应手势变化
5.界面简洁现代，包含全屏控制按钮

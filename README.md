🎧 Audio Batch Generator (Playwright + Edge CDP)

Tool tự động chia text dài thành nhiều đoạn, gửi vào web TTS (Vbee), tạo audio và tải về máy bằng Playwright điều khiển Edge qua Remote Debugging.

🚀 Features
Tự động chia text dài thành nhiều chunk
Tự động paste vào editor trên web
Click nút Preview để generate audio
Detect audio mới sinh ra
Tải file mp3 về máy
Retry khi server bị treo
Refresh page và tiếp tục xử lý
Hỗ trợ resume theo vòng chạy hiện tại (runtime state)
⚙️ Setup

1. Install dependencies
   npm install
2. Install Playwright browser dependencies
   npx playwright install
   ▶️ Run project
   Step 1: Open Edge with remote debugging
   "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" ^
   --remote-debugging-port=9222 ^
   --profile-directory="Profile 2"

⚠️ Quan trọng: phải đóng hết Edge trước khi chạy lệnh này

Step 2: Run tool
npm start
⚙️ Configuration

Edit config.json

{
"inputSelector": ".public-DraftEditor-content",
"buttonSelector": ".btn-preview",
"delayMs": 5000,
"chunkSize": 1000,
"downloadPath": "D:\\Audio\\Vbee",
"filePrefix": "audio\_",
"waitAudioTimeout": 90000,
"delayBetweenChunks": 2000,
"startIndex": 1,
"text": "..."
}
📄 Input text

Bạn có 2 cách:

Cách 1 (khuyến nghị)

Để text trong file:

input.txt
Cách 2

Nhúng trực tiếp trong config.json

📦 Output

File audio sẽ được lưu:

D:\Audio\Vbee\
 audio_001.mp3
audio_002.mp3
audio_003.mp3
🔁 Retry & Recovery

Tool sẽ tự động:

Retry nếu server treo
Reload page nếu lỗi
Làm lại chunk hiện tại cho đến khi thành công
Tiếp tục chunk tiếp theo
🧠 How it works
Split text
↓
Open web editor
↓
Paste chunk
↓
Click Preview
↓
Wait audio generated
↓
Extract audio src
↓
Download mp3
↓
Next chunk
⚠️ Requirements
Node.js >= 18
Microsoft Edge installed
Playwright installed (npx playwright install)
Edge must be opened with:
--remote-debugging-port=9222
🛠 Troubleshooting
❌ Không connect được Edge
Kiểm tra Edge đã mở chưa
Kiểm tra port 9222:
http://127.0.0.1:9222/json/version
❌ Button Preview không hoạt động
Kiểm tra selector trong config.json
Đảm bảo text đã được select (Ctrl+A logic)
❌ Audio không update
Tăng delayMs
Kiểm tra server Vbee có bị lag
📌 Notes
Tool dùng Edge profile thật → giữ nguyên login & cookie
Không cần extension
Không cần API
Chỉ cần web UI
📈 Future improvements (optional)
Resume state (save checkpoint)
Parallel processing multiple tabs
Auto detect selector
Export merged audio
Queue system

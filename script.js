// Gemini API 配置
const GEMINI_API_KEY = "AIzaSyCEFHtAG98fLQ8oSPMAGWiqc7b_Wao00wg";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// 格式化消息文本
function formatMessage(text) {
    if (!text) return '';
    
    // 處理標題和換行
    let lines = text.split('\n');
    let formattedLines = lines.map(line => {
        // 處理標題（**文本**）
        line = line.replace(/\*\*(.*?)\*\*/g, '<span class="bold-text">$1</span>');
        return line;
    });
    
    // 將 ### 替換為換行，並確保每個部分都是一個段落
    let processedText = formattedLines.join('\n');
    let sections = processedText
        .split('###')
        .filter(section => section.trim())
        .map(section => {
            // 移除多餘的換行和空格
            let lines = section.split('\n').filter(line => line.trim());
            
            if (lines.length === 0) return '';
            
            // 處理每個部分
            let result = '';
            let currentIndex = 0;
            
            while (currentIndex < lines.length) {
                let line = lines[currentIndex].trim();
                
                // 如果是數字開頭（如 "1."）
                if (/^\d+\./.test(line)) {
                    result += `<p class="section-title">${line}</p>`;
                }
                // 如果是小標題（以破折號開頭）
                else if (line.startsWith('-')) {
                    result += `<p class="subsection"><span class="bold-text">${line.replace(/^-/, '').trim()}</span></p>`;
                }
                // 如果是正文（包含冒號的行）
                else if (line.includes(':')) {
                    let [subtitle, content] = line.split(':').map(part => part.trim());
                    result += `<p><span class="subtitle">${subtitle}</span>: ${content}</p>`;
                }
                // 普通文本
                else {
                    result += `<p>${line}</p>`;
                }
                currentIndex++;
            }
            return result;
        });
    
    return sections.join('');
}

// 顯示消息
function displayMessage(role, message) {
    const messagesContainer = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.className = `message ${role}`;
    
    const avatar = document.createElement('img');
    avatar.src = role === 'user' ? 'user-avatar.png' : 'bot-avatar.png';
    avatar.alt = role === 'user' ? 'User' : 'Bot';

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    // 用戶消息直接顯示，機器人消息需要格式化
    messageContent.innerHTML = role === 'user' ? message : formatMessage(message);

    messageElement.appendChild(avatar);
    messageElement.appendChild(messageContent);
    messagesContainer.appendChild(messageElement);
    
    // 平滑滾動到底部
    messageElement.scrollIntoView({ behavior: 'smooth' });
}

// 發送消息到 Gemini API
async function sendMessage() {
    const inputElement = document.getElementById('chat-input');
    const message = inputElement.value.trim();
    
    if (!message) return;

    // 顯示用戶消息
    displayMessage('user', message);
    inputElement.value = '';

    // 顯示加載動畫
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = 'block';
    }

    try {
        // 準備 API 請求
        const payload = {
            contents: [
                {
                    parts: [
                        {
                            text: message
                        }
                    ]
                }
            ]
        };

        console.log('發送請求到 Gemini API...');
        console.log('Payload:', payload);

        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-goog-api-key': GEMINI_API_KEY
            },
            body: JSON.stringify(payload)
        });

        console.log('API 回應狀態:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP 錯誤! 狀態: ${response.status}`);
        }

        const data = await response.json();
        console.log('API 回應資料:', data);

        // 隱藏加載動畫
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }

        // 解析回應
        if (data && data.candidates && data.candidates[0] && 
            data.candidates[0].content && data.candidates[0].content.parts && 
            data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text) {
            
            const botResponse = data.candidates[0].content.parts[0].text;
            displayMessage('bot', botResponse);
        } else {
            console.error('意外的 API 回應結構:', data);
            displayMessage('bot', '抱歉，我無法理解這個回應。請稍後再試。');
        }

    } catch (error) {
        // 隱藏加載動畫
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }

        console.error('詳細錯誤:', error);
        displayMessage('bot', `連線錯誤: ${error.message}`);
    }
}

// 主題切換功能
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const chatContainer = document.querySelector('.chat-container');
    const messages = document.querySelector('.messages');
    
    // 同時切換容器的深色模式
    chatContainer.classList.toggle('dark-mode');
    messages.classList.toggle('dark-mode');
    
    // 保存主題設置
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
}

// 下拉選單功能
function toggleDropdown(event) {
    event.preventDefault();
    document.getElementById('dropdownMenu').classList.toggle('show');
}

// 點擊其他地方關閉下拉選單
window.onclick = function(event) {
    if (!event.target.matches('.dropdown button')) {
        const dropdowns = document.getElementsByClassName('dropdown-content');
        for (const dropdown of dropdowns) {
            if (dropdown.classList.contains('show')) {
                dropdown.classList.remove('show');
            }
        }
    }
}

// 頁面加載時初始化
document.addEventListener('DOMContentLoaded', () => {
    // 檢查並應用保存的主題設置
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        document.querySelector('.chat-container').classList.add('dark-mode');
        document.querySelector('.messages').classList.add('dark-mode');
    }

    // 添加回車發送功能
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        });
    }

    console.log('聊天機器人已初始化完成！');
});

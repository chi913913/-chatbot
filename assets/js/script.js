// Gemini API 配置
const GEMINI_API_KEY = "AIzaSyBbVhX2PoGwq1PtPf8zz4i4Va9Lha16dfw";
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
function displayMessage(role, message, imageData = null) {
  const messagesContainer = document.getElementById('messages');

  const avatarSrc = role === 'user' ? 'images/user_totodile.png' : 'images/AI_lugia.png';
  const avatarAlt = role === 'user' ? 'User' : 'Bot';

  const messageWrapper = document.createElement('div');
  messageWrapper.className = `message ${role}`;

  const avatar = document.createElement('img');
  avatar.src = avatarSrc;
  avatar.alt = avatarAlt;
  avatar.className = 'avatar';

  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';

  // 文字內容
  if (message) {
    const textContent = document.createElement('div');
    textContent.innerHTML = role === 'user' ? message : formatMessage(message);
    messageContent.appendChild(textContent);
  }

  // 圖片內容（如果有）
  if (imageData) {
    // 處理單張圖片（向後兼容）
    if (typeof imageData === 'string') {
      const image = document.createElement('img');
      image.src = imageData;
      image.className = 'uploaded-image';
      image.alt = '上傳的圖片';
      image.style.maxWidth = '100%';
      image.style.borderRadius = '12px';
      image.style.marginTop = '8px';
      messageContent.appendChild(image);
    }
    // 處理多張圖片（陣列）
    else if (Array.isArray(imageData) && imageData.length > 0) {
      const imagesContainer = document.createElement('div');
      imagesContainer.style.display = 'flex';
      imagesContainer.style.flexWrap = 'wrap';
      imagesContainer.style.gap = '8px';
      imagesContainer.style.marginTop = '8px';
      
      imageData.forEach((imgData, index) => {
        const image = document.createElement('img');
        image.src = imgData;
        image.className = 'uploaded-image';
        image.alt = `上傳的圖片 ${index + 1}`;
        image.style.maxWidth = '200px';
        image.style.maxHeight = '200px';
        image.style.objectFit = 'contain';
        image.style.borderRadius = '12px';
        image.style.border = '1px solid #ddd';
        imagesContainer.appendChild(image);
      });
      
      messageContent.appendChild(imagesContainer);
    }
  }

  if (role === 'user') {
    messageWrapper.appendChild(messageContent);
    messageWrapper.appendChild(avatar);
  } else {
    messageWrapper.appendChild(avatar);
    messageWrapper.appendChild(messageContent);

  // ✅ 取得 AI 回覆文字（小寫比較方便判斷）
  const lowerMessage = message.toLowerCase();

  // ✅ 只在包含「推薦 / 磁磚 / 油漆」時顯示推薦商品
  if (lowerMessage.includes("推薦") || lowerMessage.includes("磁磚") || lowerMessage.includes("油漆")) {
    renderRecommendedProducts(messageContent); // 附加在訊息泡泡下方
  }
}

// ✅ 這兩行維持不變
messagesContainer.appendChild(messageWrapper);
messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 全域變數存儲當前選擇的圖片（陣列，最多 3 張）
let currentImageData = [];
const MAX_IMAGES = 3;

// 處理圖片上傳
function handleImageUpload(event) {
    const files = Array.from(event.target.files);
    if (!files || files.length === 0) return;

    // 檢查是否會超過最大數量限制
    const remainingSlots = MAX_IMAGES - currentImageData.length;
    if (remainingSlots <= 0) {
        alert(`最多只能上傳 ${MAX_IMAGES} 張圖片！`);
        event.target.value = '';
        return;
    }

    // 限制本次上傳的檔案數量
    const filesToProcess = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
        alert(`您已選擇 ${files.length} 張圖片，但最多只能上傳 ${MAX_IMAGES} 張。將只處理前 ${remainingSlots} 張。`);
    }

    let processedCount = 0;
    let validFilesCount = 0;

    filesToProcess.forEach(file => {
        // 檢查檔案類型
        if (!file.type.startsWith('image/')) {
            alert(`檔案 "${file.name}" 不是圖片檔案，將跳過！`);
            processedCount++;
            // 檢查是否所有檔案都處理完成
            if (processedCount === filesToProcess.length && validFilesCount > 0) {
                showImagePreview();
            }
            return;
        }

        // 檢查檔案大小 (限制為 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert(`圖片 "${file.name}" 檔案太大（超過 10MB），將跳過！`);
            processedCount++;
            // 檢查是否所有檔案都處理完成
            if (processedCount === filesToProcess.length && validFilesCount > 0) {
                showImagePreview();
            }
            return;
        }

        validFilesCount++;
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageData = e.target.result;
            
            // 檢查是否已達到最大數量（防止異步操作導致超過限制）
            if (currentImageData.length >= MAX_IMAGES) {
                alert(`已達到最大上傳數量（${MAX_IMAGES} 張）！`);
                processedCount++;
                if (processedCount === filesToProcess.length) {
                    showImagePreview();
                }
                return;
            }
            
            // 儲存圖片數據到陣列
            currentImageData.push(imageData);
            
            processedCount++;
            
            // 當所有檔案處理完成後，更新預覽
            if (processedCount === filesToProcess.length) {
                showImagePreview();
            }
        };
        
        reader.onerror = function() {
            alert(`讀取檔案 "${file.name}" 時發生錯誤！`);
            processedCount++;
            if (processedCount === filesToProcess.length && validFilesCount > 0) {
                showImagePreview();
            }
        };
        
        reader.readAsDataURL(file);
    });
    
    // 清空檔案輸入
    event.target.value = '';
}

// 顯示圖片預覽
function showImagePreview() {
    const previewContainer = document.getElementById('image-preview');
    if (!previewContainer) return;
    
    // 清空現有預覽內容
    previewContainer.innerHTML = '';
    
    if (currentImageData.length === 0) {
        previewContainer.style.display = 'none';
        return;
    }
    
    previewContainer.style.display = 'block';
    
    // 創建預覽標題
    const title = document.createElement('div');
    title.style.marginBottom = '8px';
    title.style.fontSize = '14px';
    title.style.color = '#666';
    title.textContent = `已選擇 ${currentImageData.length}/${MAX_IMAGES} 張圖片`;
    previewContainer.appendChild(title);
    
    // 創建圖片容器
    const imagesWrapper = document.createElement('div');
    imagesWrapper.style.display = 'flex';
    imagesWrapper.style.flexWrap = 'wrap';
    imagesWrapper.style.gap = '8px';
    
    // 為每張圖片創建預覽元素
    currentImageData.forEach((imageData, index) => {
        const imageWrapper = document.createElement('div');
        imageWrapper.style.position = 'relative';
        imageWrapper.style.display = 'inline-block';
        
        const previewImg = document.createElement('img');
        previewImg.src = imageData;
        previewImg.style.width = '100px';
        previewImg.style.height = '100px';
        previewImg.style.objectFit = 'cover';
        previewImg.style.borderRadius = '8px';
        previewImg.style.border = '2px solid #ddd';
        
        // 創建移除按鈕
        const removeBtn = document.createElement('button');
        removeBtn.textContent = '×';
        removeBtn.style.position = 'absolute';
        removeBtn.style.top = '-8px';
        removeBtn.style.right = '-8px';
        removeBtn.style.width = '24px';
        removeBtn.style.height = '24px';
        removeBtn.style.borderRadius = '50%';
        removeBtn.style.border = 'none';
        removeBtn.style.background = '#ff4444';
        removeBtn.style.color = 'white';
        removeBtn.style.cursor = 'pointer';
        removeBtn.style.fontSize = '18px';
        removeBtn.style.lineHeight = '20px';
        removeBtn.style.display = 'flex';
        removeBtn.style.alignItems = 'center';
        removeBtn.style.justifyContent = 'center';
        removeBtn.onclick = () => removeImage(index);
        
        imageWrapper.appendChild(previewImg);
        imageWrapper.appendChild(removeBtn);
        imagesWrapper.appendChild(imageWrapper);
    });
    
    previewContainer.appendChild(imagesWrapper);
}

// 移除圖片
function removeImage(index) {
    if (index !== undefined && index >= 0 && index < currentImageData.length) {
        // 移除指定索引的圖片
        currentImageData.splice(index, 1);
    } else {
        // 如果沒有指定索引，清空所有圖片
        currentImageData = [];
    }
    
    // 更新預覽顯示
    showImagePreview();
}

// 發送圖片到 Gemini Vision API
async function sendImageToGemini(imageData, fileName) {
    // 顯示加載動畫
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = 'block';
    }

    try {
        // 將 base64 轉換為可用的格式
        const base64Data = imageData.split(',')[1];
        
        const payload = {
            contents: [
                {
                    parts: [
                        {
                            text: "請分析這張圖片並描述其內容。"
                        },
                        {
                            inline_data: {
                                mime_type: "image/jpeg",
                                data: base64Data
                            }
                        }
                    ]
                }
            ]
        };

        console.log('發送圖片到 Gemini Vision API...');

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
            throw new Error(`API金鑰已達上限: ${response.status}`);
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
            displayMessage('bot', '抱歉，我無法分析這張圖片。請稍後再試。');
        }

    } catch (error) {
        // 隱藏加載動畫
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }

        console.error('詳細錯誤:', error);
        displayMessage('bot', `圖片分析錯誤: ${error.message}`);
    }
}

// 發送消息到 Gemini API
async function sendMessage() {
    const inputElement = document.getElementById('chat-input');
    const message = inputElement.value.trim();
    
    // 如果沒有文字消息也沒有圖片，則不發送
    if (!message && (!currentImageData || currentImageData.length === 0)) return;
    
    const imagesToSend = currentImageData.length > 0 ? [...currentImageData] : null;

    // 顯示用戶消息
    if (imagesToSend && imagesToSend.length > 0) {
        // 顯示圖片
        displayMessage('user', null, imagesToSend);
    }
    if (message) {
        // 顯示文字
        displayMessage('user', message);
    }

    // 清空輸入和圖片預覽
    inputElement.value = '';
    removeImage(); // 清空所有圖片

    // 顯示加載動畫
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = 'block';
    }

    try {
        // 準備 API 請求的 parts 陣列
        const parts = [];
        
        // 如果有文字消息，添加文字部分
        if (message) {
            parts.push({ text: message });
        }
        
        // 如果有圖片，添加圖片部分
        if (imagesToSend && imagesToSend.length > 0) {
            imagesToSend.forEach(imageData => {
                const base64Data = imageData.split(',')[1];
                // 嘗試檢測圖片類型，預設為 jpeg
                let mimeType = "image/jpeg";
                if (imageData.startsWith('data:image/')) {
                    const match = imageData.match(/data:image\/([^;]+)/);
                    if (match) {
                        mimeType = `image/${match[1]}`;
                    }
                }
                parts.push({
                    inline_data: {
                        mime_type: mimeType,
                        data: base64Data
                    }
                });
            });
        }

        const payload = {
            contents: [
                {
                    parts: parts
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

// === 商品推薦卡片展示（Champion Tiles 版本） ===
async function renderRecommendedProducts(container) {
  try {
    // 1️⃣ 載入本地 JSON 檔案
    const res = await fetch('./assets/data/champion_tiles.json');
    const products = await res.json();

    // 2️⃣ 建立主容器
    const productContainer = document.createElement('div');
    productContainer.className = 'product-recommendation';

    // 標題
    const header = document.createElement('h4');
    header.textContent = '🏠 推薦商品';
    productContainer.appendChild(header);

    // 3️⃣ 建立商品格線
    const grid = document.createElement('div');
    grid.className = 'product-grid';

    // 4️⃣ 逐一建立卡片
    products.slice(0, 12).forEach(p => {
      const card = document.createElement('div');
      card.className = 'product-card';

      // 商品圖片
      const img = document.createElement('img');
      img.src = p.image || './assets/images/demo_pic.jpg'; // fallback 圖片
      img.alt = p.name;
      img.className = 'product-image';

      // 商品名稱（可點擊）
      const name = document.createElement('a');
      name.href = p.link || '#';
      name.textContent = p.name || '未命名商品';
      name.target = '_blank';
      name.className = 'product-name';

      // 商品價格（如果有的話）
      const price = document.createElement('div');
      price.textContent = p.price ? `NT$${p.price}` : '—';
      price.className = 'product-price';

      // 卡片組合
      card.appendChild(img);
      card.appendChild(name);
      card.appendChild(price);
      grid.appendChild(card);
    });

    // 5️⃣ 組裝並插入畫面
    productContainer.appendChild(grid);
    container.appendChild(productContainer);

    console.log(`✅ 已載入 ${products.length} 筆推薦商品`);
  } catch (err) {
    console.error('❌ 無法載入推薦商品：', err);
  }
}


// === 點擊快速提問 ===
function setQuickQuestion(text) {
  const input = document.getElementById("chat-input");
  input.value = text;
  input.focus();
}

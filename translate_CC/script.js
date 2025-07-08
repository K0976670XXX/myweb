// 預設語言類型
let input_type = 'tw';
let output_type = 'cn';

// 設置輸入類型並鎖定選定按鈕
function setInputType(type, button) {
    input_type = type;
    lockButton('inputButtonGroup', button);
    checkWarning(); // 檢查警告訊息
    convert(); // 更新輸出
}

// 設置輸出類型並鎖定選定按鈕
function setOutputType(type, button) {
    output_type = type;
    lockButton('outputButtonGroup', button);
    checkWarning(); // 檢查警告訊息
    convert(); // 更新輸出
}

// 鎖定選定按鈕並釋放同組其他按鈕
function lockButton(groupId, selectedButton) {
    const buttons = document.querySelectorAll(`#${groupId} button`);
    buttons.forEach(button => {
        button.disabled = false;
    });
    selectedButton.disabled = true; // 鎖定當前選定的按鈕
}

// 檢查是否顯示警告訊息
function checkWarning() {
    if (input_type === 'twp' && output_type === 'tw') {
        alert("警告：此用法可能會顯示繁體字但包含中國用詞。");
    }
}

// 自動更新輸出框
async function convert() {
    const simplifiedText = document.getElementById('simplifiedInput').value;
    // 使用 OpenCC.js 進行簡繁體轉換
    const converter = await OpenCC.Converter({ from: input_type, to: output_type });
    const traditionalText = converter(simplifiedText);
    document.getElementById('traditionalOutput').innerText = traditionalText;
}

// 複製輸出內容到剪貼板
function copyToClipboard() {
    const outputText = document.getElementById('traditionalOutput').innerText;
    navigator.clipboard.writeText(outputText).then(() => {
        alert("已複製到剪貼板！");
    }).catch(err => {
        alert("複製失敗：" + err);
    });
}
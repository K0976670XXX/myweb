import { AutoModel, AutoProcessor, env, RawImage } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@latest';

// Since we will download the model from the Hugging Face Hub, we can skip the local model check
env.allowLocalModels = false;

// Proxy the WASM backend to prevent the UI from freezing
env.backends.onnx.wasm.proxy = true;

// Constants
const EXAMPLE_URL = 'ex/my_wife.png';

// Reference the elements that we will need
const status = document.getElementById('status');
const fileUpload = document.getElementById('upload');
const img_show = document.getElementById('img_show');
const downloadBtn = document.getElementById('downloadBtn');
// Load model and processor
status.textContent = '載入模型中...';

const model = await AutoModel.from_pretrained('briaai/RMBG-1.4', {
  // Do not require config.json to be present in the repository
  config: { model_type: 'custom' },
});

const processor = await AutoProcessor.from_pretrained('briaai/RMBG-1.4', {
  // Do not require config.json to be present in the repository
  config: {
    do_normalize: true,
    do_pad: false,
    do_rescale: true,
    do_resize: true,
    image_mean: [0.5, 0.5, 0.5],
    feature_extractor_type: "ImageFeatureExtractor",
    image_std: [1, 1, 1],
    resample: 2,
    rescale_factor: 0.00392156862745098,
    size: { width: 1024, height: 1024 },
  }
});

status.textContent = '準備好了';

// 監聽檔案上傳的變化
fileUpload.addEventListener('change', function (e) {
  downloadBtn.style.display = 'none';
  const file = e.target.files[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();

  // 檔案載入完成後顯示圖片
  reader.onload = e2 => {
  img_show.src = e2.target.result; // 將圖片內容設定為img的src
  img_show.style.height = '70%'; // 設定圖片高度為頁面高度的70%
  img_show.style.width = 'auto'; // 自動計算寬度，保持寬高比

  // 將狀態更新並顯示圖片
  status.textContent = '圖片已載入';
  predict(e2.target.result); // 呼叫 predict 函式
  };
  reader.readAsDataURL(file); // 讀取檔案內容
});

// Predict foreground of the given image
async function predict(url) {
  // Read image
  const image = await RawImage.fromURL(url);

  // Preprocess image
  status.textContent = '處理影像中...';
  const { pixel_values } = await processor(image);

  // Predict alpha matte
  const { output } = await model({ input: pixel_values });

  // Resize mask back to original size
  const mask = await RawImage.fromTensor(output[0].mul(255).to('uint8')).resize(image.width, image.height);

  // Create new canvas
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');

  // Draw original image output to canvas
  ctx.drawImage(image.toCanvas(), 0, 0);

  // Update alpha channel
  const pixelData = ctx.getImageData(0, 0, image.width, image.height);
  for (let i = 0; i < mask.data.length; ++i) {
  pixelData.data[4 * i + 3] = mask.data[i];
  }
  ctx.putImageData(pixelData, 0, 0);

  // Convert canvas to data URL
  const imgURL = canvas.toDataURL();

  // Display the result in <img id="img_show">
  const imgShow = document.getElementById('img_show');
  imgShow.src = imgURL;

  // 顯示下載按鈕並設定其連結
  downloadBtn.style.display = 'inline';
  downloadBtn.href = imgURL; // 將圖片資料URL設定為下載連結

  status.textContent = '完畢!';
}

downloadBtn.addEventListener('click', function() {
  const link = document.createElement('a');
  link.href = downloadBtn.href;
  link.download = 'processed_image.png';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});
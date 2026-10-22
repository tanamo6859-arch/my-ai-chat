export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '許可されていないリクエストです。' });
  }

  // 前後の余計な空白を自動で取り除く
  const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : null;
  if (!apiKey) {
    return res.status(500).json({ error: 'VercelにGEMINI_API_KEYが登録されていません。' });
  }

  const { contents } = req.body;
  if (!contents || !Array.isArray(contents)) {
    return res.status(400).json({ error: '質問内容が正しくありません。' });
  }

  try {
    // 最新のGeminiモデルを指定
    const model = 'gemini-2.5-flash';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: contents,
        systemInstruction: {
          parts: [{ text: "あなたは親切で温かい相談相手です。相談者の悩みに寄り添い、分かりやすい日本語で丁寧に回答してください。" }]
        }
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const detail = errData?.error?.message || `エラー番号: ${response.status}`;
      return res.status(response.status).json({
        error: `Google側エラー: ${detail}`
      });
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || '返答を生成できませんでした。';

    return res.status(200).json({ reply: replyText });

  } catch (error) {
    return res.status(500).json({
      error: `通信エラー: ${error.message}`
    });
  }
}

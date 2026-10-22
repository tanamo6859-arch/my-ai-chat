export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '許可されていないリクエストです。' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'サーバー側にAPIキーが設定されていません。' });
  }

  const { contents } = req.body;
  if (!contents || !Array.isArray(contents)) {
    return res.status(400).json({ error: '質問内容が正しくありません。' });
  }

  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

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
      return res.status(response.status).json({
        error: 'AIからの応答取得に失敗しました。時間をおいて再度お試しください。'
      });
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || '返答を生成できませんでした。';

    return res.status(200).json({ reply: replyText });

  } catch (error) {
    return res.status(500).json({
      error: '通信エラーが発生しました。インターネット接続を確認してください。'
    });
  }
}

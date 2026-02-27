'use client';

import { GoogleGenAI } from '@google/genai';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles } from 'lucide-react';
import { Spinner } from './ui/spinner';

// Helper function to convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper function to fetch image and convert to base64
async function urlToGenerativePart(url: string, mimeType: string) {
  const response = await fetch(url);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const base64 = arrayBufferToBase64(arrayBuffer);
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
}

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState(
    "LEGO penguin technicians replacing a computer's HDD with a glowing, symbolic object representing MCP and MIDOS."
  );
  const [initialImageUrl] = useState('https://i.imgur.com/eJ51a2E.jpeg');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateImage = async () => {
    setLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
        throw new Error('Gemini API key is not configured.');
      }
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

      const imagePart = await urlToGenerativePart(initialImageUrl, 'image/jpeg');
      const textPart = { text: prompt };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, textPart] },
      });

      let generatedImagePart = null;
      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData) {
          generatedImagePart = part;
          break;
        }
      }

      if (generatedImagePart && generatedImagePart.inlineData) {
        const base64 = generatedImagePart.inlineData.data;
        const mimeType = generatedImagePart.inlineData.mimeType;
        setGeneratedImage(`data:${mimeType};base64,${base64}`);
      } else {
        throw new Error('Image generation failed. No image data received.');
      }
    } catch (e: any) {
      setError(e.message || 'An unknown error occurred.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="w-full bg-white shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="font-display text-2xl lg:text-3xl font-bold text-center text-gray-800">
            Lego Image Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col items-center space-y-2">
              <h3 className="text-lg font-semibold text-gray-700">Initial Image</h3>
              <img src={initialImageUrl} alt="Initial Lego technicians with HDD" className="rounded-lg shadow-md w-full border" />
            </div>
            <div className="flex flex-col items-center space-y-2">
              <h3 className="text-lg font-semibold text-gray-700">Generated Image</h3>
              <div className="w-full aspect-square bg-gray-100 rounded-lg shadow-inner flex items-center justify-center border">
                {loading && <Spinner />}
                {error && <p className="text-red-500 p-4 text-center">{error}</p>}
                {generatedImage && <img src={generatedImage} alt="Generated Lego scene" className="rounded-lg w-full h-full object-cover" />}
                {!loading && !error && !generatedImage && <p className="text-gray-500">Your image will appear here</p>}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Textarea
              placeholder="Enter your prompt here..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="w-full bg-gray-50"
            />
            <Button onClick={generateImage} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base">
              {loading ? (
                <>
                  <Spinner />
                  <span className='ml-2'>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Image
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

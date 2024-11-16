import { useState } from 'react';
import { Mic, Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export function SidebarPodcastApp() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [audioFile, setAudioFile] = useState(null);
  const [chatId, setChatId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [numberOfSpeakers, setNumberOfSpeakers] = useState(2);
  const [speakers, setSpeakers] = useState({});
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e) => {
    setAudioFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!audioFile || isLoading) {
      return;
    }

    setIsLoading(true);
    setStatus('Uploading audio...');
    const formData = new FormData();
    formData.append('audio', audioFile);

    try {
      // TODO: Upload file to server
      /*
        const response = await fetch('/apps/podcasts/upload', {
          method: 'POST',
          body: formData,
        })
        const data = await response.json()
      */
      const data = {
        chatId: Math.random().toString(36).substring(7),
      };
      setChatId(data.chatId);
      setStep(2);
      setStatus('');
    } catch (error) {
      console.error('Error uploading file:', error);
      setStatus('Error uploading file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranscribe = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setStatus('Transcribing podcast...');
    try {
      // TODO: Upload file to server
      /*
        const response = await fetch('/apps/podcasts/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            podcastId: chatId,
            prompt,
            numberOfSpeakers,
          }),
        })
        const data = await response.json()
      */
      const data = {
        chatId,
        response: {
          timestamp: 1731711090275,
        },
      };
      await waitForTranscription(data.chatId, data.response.timestamp);
    } catch (error) {
      console.error('Error transcribing:', error);
      setStatus('Error transcribing');
    } finally {
      setIsLoading(false);
    }
  };

  const waitForTranscription = async (chatId, timestamp) => {
    if (!chatId || !timestamp) {
      return;
    }

    while (true) {
      // TODO: Get from server
      /*
      const response = await fetch(`/chat/${chatId}`);
      const data = await response.json();
      */
      const data = {
        messages: [
          {
            timestamp: 1731711090275,
            status: 'succeeded',
          },
        ],
        output: {
          segments: [
            {
              speaker: 'speaker1',
            },
            {
              speaker: 'speaker2',
            },
          ],
        },
      };
      const message = data.messages.find((m) => m.timestamp === timestamp);
      if (message && message.status === 'succeeded') {
        const uniqueSpeakers = [
          ...new Set(data.output.segments.map((s) => s.speaker)),
        ];
        setSpeakers(Object.fromEntries(uniqueSpeakers.map((s) => [s, ''])));
        setStep(3);
        setStatus('');
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  };

  const handleSpeakerIdentification = async () => {
    if (!chatId || !speakers || isLoading) {
      return;
    }

    setIsLoading(true);
    setStatus('Summarising content...');
    try {
      // TODO: POST to server
      /*
      const response = await fetch('/apps/podcasts/summarise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          podcastId: chatId,
          speakers,
        }),
      })
      await response.json()
      */
      setStep(4);
      setStatus('');
    } catch (error) {
      console.error('Error summarising:', error);
      setStatus('Error summarising');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!chatId || isLoading) {
      return;
    }

    setIsLoading(true);
    setStatus('Generating image...');
    try {
      // TODO: POST to server
      /*
      await fetch('/apps/podcasts/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          podcastId: chatId,
        }),
      })
      */
      setStatus('Process completed successfully!');
      setTimeout(() => {
        setIsOpen(false);
        setStep(1);
        setStatus('');
        setIsLoading(false);
        // Reset other state variables as needed
        setAudioFile(null);
        setChatId('');
        setPrompt('');
        setNumberOfSpeakers(2);
        setSpeakers({});
      }, 3000);
    } catch (error) {
      console.error('Error generating image:', error);
      setStatus('Error generating image');
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-center"
          onClick={() => setIsOpen(true)}
        >
          <Mic className="h-4 w-4" />
          <span className="sr-only">Transcribe</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transcribe Content</DialogTitle>
          <DialogDescription>
            {step === 1 && 'Upload a clip to transcribe the content.'}
            {step === 2 && 'Enter prompt and number of speakers.'}
            {step === 3 && 'Identify speakers.'}
            {step === 4 && 'Generate image for the podcast.'}
          </DialogDescription>
        </DialogHeader>
        {step === 1 && (
          <div className="flex items-end space-x-2">
            <Label className="flex-1">
              <div className="pb-2">Upload Clip</div>
              <Input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                disabled={isLoading}
              />
            </Label>
            <Button
              variant="default"
              onClick={handleUpload}
              disabled={!audioFile || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading
                </>
              ) : (
                'Upload'
              )}
            </Button>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="prompt">Prompt</Label>
              <Input
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter prompt..."
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="speakers">Number of Speakers</Label>
              <Input
                id="speakers"
                type="number"
                value={numberOfSpeakers}
                onChange={(e) => setNumberOfSpeakers(Number(e.target.value))}
                min={1}
                disabled={isLoading}
              />
            </div>
            <Button onClick={handleTranscribe} disabled={!prompt || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Transcribing
                </>
              ) : (
                'Transcribe'
              )}
            </Button>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            {Object.entries(speakers).map(([speaker, name]) => (
              <div key={speaker}>
                <Label htmlFor={speaker}>{speaker}</Label>
                <Input
                  id={speaker}
                  value={name}
                  onChange={(e) =>
                    setSpeakers({ ...speakers, [speaker]: e.target.value })
                  }
                  placeholder="Enter speaker name"
                  disabled={isLoading}
                />
              </div>
            ))}
            <Button
              onClick={handleSpeakerIdentification}
              disabled={
                Object.values(speakers).some((name) => !name) || isLoading
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Identifying Speakers
                </>
              ) : (
                'Identify Speakers'
              )}
            </Button>
          </div>
        )}
        {step === 4 && (
          <Button onClick={handleGenerateImage} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Image
              </>
            ) : (
              'Generate Image'
            )}
          </Button>
        )}
        {status && (
          <div className="mt-4 text-sm text-muted-foreground">{status}</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

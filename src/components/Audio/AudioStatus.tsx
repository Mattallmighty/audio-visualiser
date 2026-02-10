import { Typography } from '@mui/material'

interface AudioStatusProps {
  audioSource: 'backend' | 'mic'
  micError: string | null
  isListening: boolean
  micData: {
    bpm: number
    [key: string]: any
  }
  backendAudioData?: number[]
}

const AudioStatus: React.FC<AudioStatusProps> = ({
  audioSource,
  micError,
  isListening,
  micData,
  backendAudioData
}) => {
  return (
    <Typography variant="body2" color={micError ? 'error' : 'textSecondary'}>
      {audioSource === 'mic'
        ? micError
          ? `Error: ${micError}`
          : isListening
            ? `Listening (BPM: ${micData.bpm})`
            : 'Microphone Inactive'
        : (backendAudioData && backendAudioData.length > 0)
          ? 'Receiving Backend Audio'
          : 'Waiting for Backend Audio'}
    </Typography>
  )
}

export default AudioStatus

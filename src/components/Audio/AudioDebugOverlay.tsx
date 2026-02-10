/**
 * AudioDebugOverlay - Displays real-time audio analysis metrics
 * 
 * Shows BPM, confidence, volume, frequency bands, and spectral features
 * for debugging and monitoring microphone input.
 */

import React from 'react'
import { Paper, Typography, TableContainer, Table, TableBody, TableRow, TableCell, Box } from '@mui/material'

interface AudioDebugOverlayProps {
  micData: {
    bpm: number
    confidence: number
    overall: number
    bass: number
    mid: number
    high: number
    spectralCentroid: number
    spectralFlatness: number
    isBeat: boolean
  }
}

const AudioDebugOverlay: React.FC<AudioDebugOverlayProps> = ({ micData }) => {
  return (
    <Paper
      sx={{
        position: 'absolute',
        top: 20,
        right: 20,
        p: 2,
        width: 250,
        bgcolor: 'rgba(0,0,0,0.8)',
        color: 'white',
        zIndex: 10
      }}
    >
      <Typography variant="subtitle2" gutterBottom sx={{ color: '#4fc3f7' }}>
        Audio Debug
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333' }}>
                BPM
              </TableCell>
              <TableCell sx={{ color: 'white', borderBottom: '1px solid #333' }}>
                {micData.bpm}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333' }}>
                Confidence
              </TableCell>
              <TableCell sx={{ color: 'white', borderBottom: '1px solid #333' }}>
                {(micData.confidence * 100).toFixed(0)}%
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333' }}>
                Vol (RMS)
              </TableCell>
              <TableCell sx={{ color: 'white', borderBottom: '1px solid #333' }}>
                {micData.overall.toFixed(3)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333' }}>
                Bass
              </TableCell>
              <TableCell sx={{ color: 'white', borderBottom: '1px solid #333' }}>
                {micData.bass.toFixed(2)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333' }}>
                Mid
              </TableCell>
              <TableCell sx={{ color: 'white', borderBottom: '1px solid #333' }}>
                {micData.mid.toFixed(2)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333' }}>
                High
              </TableCell>
              <TableCell sx={{ color: 'white', borderBottom: '1px solid #333' }}>
                {micData.high.toFixed(2)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333' }}>
                Brightness
              </TableCell>
              <TableCell sx={{ color: 'white', borderBottom: '1px solid #333' }}>
                {micData.spectralCentroid.toFixed(2)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: '#aaa', borderBottom: 'none' }}>
                Noisiness
              </TableCell>
              <TableCell sx={{ color: 'white', borderBottom: 'none' }}>
                {micData.spectralFlatness.toFixed(2)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      {micData.isBeat && (
        <Box
          sx={{
            mt: 1,
            height: 4,
            width: '100%',
            bgcolor: '#4fc3f7',
            boxShadow: '0 0 10px #4fc3f7'
          }}
        />
      )}
    </Paper>
  )
}

export default AudioDebugOverlay

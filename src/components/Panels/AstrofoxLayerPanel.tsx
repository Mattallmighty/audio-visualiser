import { useEffect, useState, useMemo, useCallback, type RefObject } from 'react'
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Typography,
  Tooltip,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Collapse,
  TextField
} from '@mui/material'
import {
  Add,
  Delete,
  Visibility,
  VisibilityOff,
  KeyboardArrowUp,
  KeyboardArrowDown,
  ExpandMore,
  ExpandLess,
  ContentCopy,
  TextFields,
  Image as ImageIcon,
  BarChart,
  GraphicEq,
  Timeline,
  ViewInAr,
  Folder,
  Edit
} from '@mui/icons-material'
import type { AstrofoxVisualiserRef } from '../Visualisers'
import type {
  AstrofoxLayerType,
  AstrofoxLayer,
  GroupLayer
} from '../../engines/astrofox/types'
import { LayerControlsRenderer } from '../Visualisers/Astrofox/LayerControlsRenderer'

// Layer type icons
const LAYER_ICONS: Record<AstrofoxLayerType, React.ReactNode> = {
  barSpectrum: <BarChart fontSize="small" />,
  waveSpectrum: <GraphicEq fontSize="small" />,
  soundWave: <Timeline fontSize="small" />,
  soundWave2: <GraphicEq fontSize="small" />,
  text: <TextFields fontSize="small" />,
  image: <ImageIcon fontSize="small" />,
  geometry3d: <ViewInAr fontSize="small" />,
  group: <Folder fontSize="small" />
}

export interface AstrofoxLayerPanelProps {
  astrofoxRef: RefObject<AstrofoxVisualiserRef | null>
}

export function AstrofoxLayerPanel({ astrofoxRef }: AstrofoxLayerPanelProps) {
  // Local state for UI (not shared with AstrofoxVisualiser)
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null)
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)
  const [dropPosition, setDropPosition] = useState<'above' | 'below' | 'inside' | null>(null)
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  // Store layers in state to prevent infinite loops
  // Only update when the actual layers array reference changes
  const [layers, setLayers] = useState<AstrofoxLayer[]>(() => astrofoxRef.current?.layers || [])

  // Force re-render when layers change
  // Called explicitly after layer operations (add, remove, update, etc.)
  const refreshLayers = useCallback(() => {
    const currentLayers = astrofoxRef.current?.layers || []
    setLayers([...currentLayers]) // Create new reference to trigger updates
  }, [astrofoxRef])

  // Calculate top-level layers (not inside any group)
  const topLevelLayers = useMemo(() => {
    const childIds = new Set<string>()
    layers.forEach((layer) => {
      if (layer.type === 'group') {
        const groupLayer = layer as GroupLayer
        groupLayer.childIds.forEach((id) => childIds.add(id))
      }
    })
    return layers.filter((layer) => !childIds.has(layer.id))
  }, [layers])

  // Get selected layer
  const selectedLayer = useMemo(
    () => layers.find((l) => l.id === selectedLayerId) || null,
    [layers, selectedLayerId]
  )

  // Auto-select the first layer if none selected and layers exist
  useEffect(() => {
    if (!selectedLayerId && topLevelLayers.length > 0) {
      // Select the top layer (last in reversed array)
      const topLayer = topLevelLayers[topLevelLayers.length - 1]
      if (topLayer) {
        setSelectedLayerId(topLayer.id)
      }
    }
  }, [selectedLayerId, topLevelLayers])

  // Layer operations (call methods on astrofoxRef)
  const addLayer = useCallback(
    (type: AstrofoxLayerType) => {
      astrofoxRef.current?.addLayer(type)
      refreshLayers()
    },
    [astrofoxRef, refreshLayers]
  )

  const removeLayer = useCallback(
    (id: string) => {
      astrofoxRef.current?.removeLayer(id)
      if (selectedLayerId === id) {
        setSelectedLayerId(null)
      }
      refreshLayers()
    },
    [astrofoxRef, selectedLayerId, refreshLayers]
  )

  const duplicateLayer = useCallback(
    (id: string) => {
      astrofoxRef.current?.duplicateLayer(id)
      refreshLayers()
    },
    [astrofoxRef, refreshLayers]
  )

  const moveLayer = useCallback(
    (id: string, direction: 'up' | 'down') => {
      astrofoxRef.current?.moveLayer(id, direction)
      refreshLayers()
    },
    [astrofoxRef, refreshLayers]
  )

  const toggleLayerVisibility = useCallback(
    (id: string) => {
      astrofoxRef.current?.toggleLayerVisibility(id)
      refreshLayers()
    },
    [astrofoxRef, refreshLayers]
  )

  const updateLayer = useCallback(
    (id: string, updates: Partial<AstrofoxLayer>) => {
      astrofoxRef.current?.updateLayer(id, updates)
      refreshLayers()
    },
    [astrofoxRef, refreshLayers]
  )

  const removeFromGroup = useCallback(
    (childId: string) => {
      astrofoxRef.current?.removeFromGroup?.(childId)
      refreshLayers()
    },
    [astrofoxRef, refreshLayers]
  )

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, layerId: string) => {
    e.stopPropagation()
    setDraggedLayerId(layerId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', layerId)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedLayerId(null)
    setDropTargetId(null)
    setDropPosition(null)
  }, [])

  const handleDragOver = useCallback(
    (e: React.DragEvent, targetId: string, isGroup: boolean) => {
      e.preventDefault()
      e.stopPropagation()

      if (!draggedLayerId || draggedLayerId === targetId) return

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const y = e.clientY - rect.top
      const height = rect.height

      let position: 'above' | 'below' | 'inside' = 'above'

      if (isGroup && y > height * 0.33 && y < height * 0.67) {
        position = 'inside'
      } else if (y > height / 2) {
        position = 'below'
      }

      setDropTargetId(targetId)
      setDropPosition(position)
    },
    [draggedLayerId]
  )

  const handleDragLeave = useCallback(() => {
    setDropTargetId(null)
    setDropPosition(null)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault()
      e.stopPropagation()

      if (!draggedLayerId || draggedLayerId === targetId) return

      // Call reorderLayer on astrofoxRef (will need to add this method)
      astrofoxRef.current?.reorderLayer?.(draggedLayerId, targetId, dropPosition || 'above')

      setDraggedLayerId(null)
      setDropTargetId(null)
      setDropPosition(null)
      refreshLayers()
    },
    [draggedLayerId, dropPosition, astrofoxRef, refreshLayers]
  )

  const toggleGroupExpanded = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }, [])

  // Handle layer name editing
  const startEditing = useCallback((layer: AstrofoxLayer) => {
    setEditingLayerId(layer.id)
    setEditingName(layer.name)
  }, [])

  const cancelEditing = useCallback(() => {
    setEditingLayerId(null)
    setEditingName('')
  }, [])

  const saveEditing = useCallback(() => {
    if (editingLayerId && editingName.trim()) {
      updateLayer(editingLayerId, { name: editingName.trim() })
    }
    setEditingLayerId(null)
    setEditingName('')
  }, [editingLayerId, editingName, updateLayer])

  // Refresh on layer operations
  // No aggressive polling - rely on explicit refreshLayers calls after layer operations

  return (
    <Card variant="outlined" sx={{ width: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* Left Column: Layer List */}
          <Box sx={{ width: 280, borderRight: 1, borderColor: 'divider' }}>
            <Typography variant="overline" sx={{ px: 2, py: 1, display: 'block' }}>
              Layers
            </Typography>

            <List dense sx={{ maxHeight: 400, overflow: 'auto', py: 0 }}>
              {topLevelLayers.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  No layers yet
                </Typography>
              ) : (
                [...topLevelLayers].reverse().map((layer) => {
                  const isGroup = layer.type === 'group'
                  const groupLayer = isGroup ? (layer as GroupLayer) : null
                  const isExpanded = expandedGroups.has(layer.id)
                  const isDragging = draggedLayerId === layer.id
                  const isDropTarget = dropTargetId === layer.id
                  const showDropAbove = isDropTarget && dropPosition === 'above'
                  const showDropBelow = isDropTarget && dropPosition === 'below'
                  const showDropInside = isDropTarget && dropPosition === 'inside' && isGroup

                  return (
                    <Box key={layer.id}>
                      <ListItem
                        disablePadding
                        draggable
                        onDragStart={(e) => handleDragStart(e, layer.id)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, layer.id, isGroup)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, layer.id)}
                        sx={{
                          opacity: isDragging ? 0.5 : 1,
                          bgcolor: showDropInside ? 'action.hover' : 'transparent',
                          borderTop: showDropAbove ? '2px solid' : 'none',
                          borderBottom: showDropBelow ? '2px solid' : 'none',
                          borderLeft: showDropInside ? '3px solid' : 'none',
                          borderColor: 'primary.main',
                          cursor: 'grab',
                          transition: 'border 0.1s ease'
                        }}
                        secondaryAction={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {isGroup && groupLayer && groupLayer.childIds.length > 0 && (
                              <IconButton
                                edge="end"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleGroupExpanded(layer.id)
                                }}
                              >
                                {isExpanded ? (
                                  <ExpandLess fontSize="small" />
                                ) : (
                                  <ExpandMore fontSize="small" />
                                )}
                              </IconButton>
                            )}
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleLayerVisibility(layer.id)
                              }}
                            >
                              {layer.visible ? (
                                <Visibility fontSize="small" />
                              ) : (
                                <VisibilityOff fontSize="small" />
                              )}
                            </IconButton>
                          </Box>
                        }
                      >
                        <ListItemButton
                          selected={selectedLayerId === layer.id}
                          onClick={() => setSelectedLayerId(layer.id)}
                          sx={{ py: 0.5 }}
                        >
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            {LAYER_ICONS[layer.type]}
                          </ListItemIcon>
                          {editingLayerId === layer.id ? (
                            <TextField
                              size="small"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onBlur={saveEditing}
                              onKeyDown={(e: React.KeyboardEvent) => {
                                if (e.key === 'Enter') {
                                  saveEditing()
                                } else if (e.key === 'Escape') {
                                  cancelEditing()
                                }
                              }}
                              autoFocus
                              sx={{ flex: 1, mr: 1 }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <ListItemText
                              primary={layer.name}
                              primaryTypographyProps={{
                                variant: 'body2',
                                sx: { opacity: layer.visible ? 1 : 0.5 }
                              }}
                            />
                          )}
                          {editingLayerId !== layer.id && (
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation()
                                startEditing(layer)
                              }}
                              sx={{ ml: 0.5, mr: 1 }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          )}
                        </ListItemButton>
                      </ListItem>

                      {/* Render children of groups */}
                      {isGroup && groupLayer && isExpanded && (
                        <Collapse in={isExpanded}>
                          <List
                            dense
                            sx={{
                              py: 0,
                              pl: 2,
                              borderLeft: '1px solid',
                              borderColor: 'divider',
                              ml: 2
                            }}
                          >
                            {groupLayer.childIds.map((childId) => {
                              const childLayer = layers.find((l) => l.id === childId)
                              if (!childLayer) return null

                              return (
                                <ListItem
                                  key={childId}
                                  disablePadding
                                  secondaryAction={
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <Tooltip title="Remove from group">
                                        <IconButton
                                          edge="end"
                                          size="small"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            removeFromGroup(childId)
                                          }}
                                        >
                                          <KeyboardArrowUp fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                      <IconButton
                                        edge="end"
                                        size="small"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          toggleLayerVisibility(childId)
                                        }}
                                      >
                                        {childLayer.visible ? (
                                          <Visibility fontSize="small" />
                                        ) : (
                                          <VisibilityOff fontSize="small" />
                                        )}
                                      </IconButton>
                                    </Box>
                                  }
                                >
                                  <ListItemButton
                                    selected={selectedLayerId === childId}
                                    onClick={() => setSelectedLayerId(childId)}
                                    sx={{ py: 0.5 }}
                                  >
                                    <ListItemIcon sx={{ minWidth: 32 }}>
                                      {LAYER_ICONS[childLayer.type]}
                                    </ListItemIcon>
                                    {editingLayerId === childId ? (
                                      <TextField
                                        size="small"
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        onBlur={saveEditing}
                                        onKeyDown={(e: React.KeyboardEvent) => {
                                          if (e.key === 'Enter') {
                                            saveEditing()
                                          } else if (e.key === 'Escape') {
                                            cancelEditing()
                                          }
                                        }}
                                        autoFocus
                                        sx={{ flex: 1, mr: 1 }}
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    ) : (
                                      <ListItemText
                                        primary={childLayer.name}
                                        primaryTypographyProps={{
                                          variant: 'body2',
                                          sx: { opacity: childLayer.visible ? 1 : 0.5 }
                                        }}
                                      />
                                    )}
                                    {editingLayerId !== childId && (
                                      <IconButton
                                        size="small"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          startEditing(childLayer)
                                        }}
                                        sx={{ ml: 0.5, mr: 1 }}
                                      >
                                        <Edit fontSize="small" />
                                      </IconButton>
                                    )}
                                  </ListItemButton>
                                </ListItem>
                              )
                            })}
                          </List>
                        </Collapse>
                      )}
                    </Box>
                  )
                })
              )}
            </List>

            {/* Add Layer Buttons */}
            <Box sx={{ p: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap', borderTop: 1, borderColor: 'divider' }}>
              <Tooltip title="Bar Spectrum">
                <IconButton size="small" onClick={() => addLayer('barSpectrum')}>
                  <BarChart fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Wave Spectrum">
                <IconButton size="small" onClick={() => addLayer('waveSpectrum')}>
                  <GraphicEq fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Sound Wave">
                <IconButton size="small" onClick={() => addLayer('soundWave')}>
                  <Timeline fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Sound Wave 2">
                <IconButton size="small" onClick={() => addLayer('soundWave2')}>
                  <GraphicEq fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Text">
                <IconButton size="small" onClick={() => addLayer('text')}>
                  <TextFields fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Image">
                <IconButton size="small" onClick={() => addLayer('image')}>
                  <ImageIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Geometry (3D)">
                <IconButton size="small" onClick={() => addLayer('geometry3d')}>
                  <ViewInAr fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Group">
                <IconButton size="small" onClick={() => addLayer('group')}>
                  <Folder fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Right Column: Layer Controls */}
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1 }}>
              <Typography variant="overline">
                {selectedLayer ? selectedLayer.name : 'Layer Controls'}
              </Typography>
              {selectedLayer && (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Move Up">
                    <IconButton size="small" onClick={() => moveLayer(selectedLayer.id, 'up')}>
                      <KeyboardArrowUp fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Move Down">
                    <IconButton size="small" onClick={() => moveLayer(selectedLayer.id, 'down')}>
                      <KeyboardArrowDown fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Duplicate">
                    <IconButton size="small" onClick={() => duplicateLayer(selectedLayer.id)}>
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      onClick={() => removeLayer(selectedLayer.id)}
                      color="error"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>

            {selectedLayer ? (
              <LayerControlsRenderer
                layer={selectedLayer}
                onUpdate={(updates) => updateLayer(selectedLayer.id, updates)}
                allLayers={layers}
              />
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                Select a layer to edit its properties
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default AstrofoxLayerPanel

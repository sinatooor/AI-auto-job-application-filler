import {
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Collapse,
  Fade,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import React, { FC, useState } from 'react'

import { useAppContext } from '../AppContext'
import { EditableAnswer } from '../hooks/useEditableAnswerState'
import { sentenceCase } from '@src/shared/utils/strings'
import { Item } from './components'

/** A single read-only probable-value card. */
const ProbableValueCard: FC<{ answer: EditableAnswer }> = ({ answer }) => {
  const {
    backend,
    editableAnswerState: { addNewAnswer },
  } = useAppContext()

  const { originalAnswer } = answer

  const handleUse = () => {
    addNewAnswer(backend.path, originalAnswer.answer)
  }

  return (
    <Paper elevation={2} sx={{ p: 1, width: '100%', opacity: 0.9 }}>
      <Box>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={0.5}
        >
          <Breadcrumbs separator=">">
            <Chip
              size="small"
              variant="outlined"
              label={originalAnswer.path.section || '—'}
              avatar={
                <Tooltip title="Section">
                  <Avatar sx={{ width: 20, height: 20, fontSize: 12 }}>S</Avatar>
                </Tooltip>
              }
            />
            <Chip
              size="small"
              variant="outlined"
              label={originalAnswer.path.fieldType || '—'}
              avatar={
                <Tooltip title="Type">
                  <Avatar sx={{ width: 20, height: 20, fontSize: 12 }}>T</Avatar>
                </Tooltip>
              }
            />
            <Chip
              size="small"
              variant="outlined"
              sx={{
                height: 'auto',
                minHeight: '24px',
                textWrap: 'inherit',
                '& .MuiChip-label': {
                  display: 'block',
                  whiteSpace: 'normal',
                },
              }}
              label={originalAnswer.path.fieldName}
              avatar={
                <Tooltip title="Question">
                  <Avatar sx={{ width: 20, height: 20, fontSize: 12 }}>Q</Avatar>
                </Tooltip>
              }
            />
          </Breadcrumbs>
          <Button size="small" variant="outlined" onClick={handleUse}>
            Use
          </Button>
        </Box>

        {originalAnswer.matchType && (
          <Typography variant="caption" color="textSecondary">
            {sentenceCase(originalAnswer.matchType)}
          </Typography>
        )}

        <Typography
          variant="body2"
          sx={{
            mt: 0.5,
            maxHeight: 48,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            wordBreak: 'break-word',
          }}
          title={
            typeof originalAnswer.answer === 'string'
              ? originalAnswer.answer
              : JSON.stringify(originalAnswer.answer)
          }
        >
          {typeof originalAnswer.answer === 'string'
            ? originalAnswer.answer
            : JSON.stringify(originalAnswer.answer)}
        </Typography>
      </Box>
    </Paper>
  )
}

export const ProbableValuesSection: FC = () => {
  const {
    editableAnswerState: { probableAnswers },
  } = useAppContext()
  const [expanded, setExpanded] = useState(false)

  if (!probableAnswers || probableAnswers.length === 0) {
    return null
  }

  return (
    <>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        sx={{ cursor: 'pointer' }}
        onClick={() => setExpanded((v) => !v)}
      >
        <Typography variant="h6">
          Probable Values ({probableAnswers.length})
        </Typography>
        <Typography variant="caption" color="textSecondary">
          {expanded ? 'collapse ▲' : 'expand ▼'}
        </Typography>
      </Box>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Stack spacing={1} mt={1}>
          {probableAnswers.map((answer) => (
            <Fade
              key={answer.id}
              in
              timeout={{ enter: 300 }}
              unmountOnExit
            >
              <div>
                <ProbableValueCard answer={answer} />
              </div>
            </Fade>
          ))}
        </Stack>
      </Collapse>
    </>
  )
}

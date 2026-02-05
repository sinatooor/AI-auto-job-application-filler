import React, { FC, useEffect, useState } from 'react'
import {
    Box,
    Card,
    CardContent,
    Typography,
    Chip,
    IconButton,
    Stack,
    CircularProgress,
    Button // Added Button import
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { ApplicationRecord, TrackerService } from '../../services/trackerService'

export const Tracker: FC<{ onBack: () => void }> = ({ onBack }) => {
    const [apps, setApps] = useState<ApplicationRecord[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadApps()
    }, [])

    const loadApps = async () => {
        const data = await TrackerService.getApplications()
        setApps(data.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()))
        setLoading(false)
    }

    const handleDelete = async (id: string) => {
        await TrackerService.deleteApplication(id)
        loadApps()
    }

    if (loading) {
        return <Box display="flex" justifyContent="center" p={3}><CircularProgress /></Box>
    }

    return (
        <Box>
            <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
                <Button onClick={onBack} variant="text">Back</Button>
                <Typography variant="h6">Application History</Typography>
            </Box>

            {apps.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center">
                    No applications tracked yet.
                </Typography>
            ) : (
                <Stack spacing={2}>
                    {apps.map((app) => (
                        <Card key={app.id} variant="outlined">
                            <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                                <Typography variant="subtitle2" component="div">
                                    {app.position || 'Unknown Position'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {app.company || 'Unknown Company'}
                                </Typography>
                                <Box mt={1} display="flex" justifyContent="space-between" alignItems="center">
                                    <Chip
                                        label={new Date(app.appliedAt).toLocaleDateString()}
                                        size="small"
                                        variant="outlined"
                                    />
                                    <IconButton size="small" onClick={() => handleDelete(app.id)}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Stack>
            )}
        </Box>
    )
}

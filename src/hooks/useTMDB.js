import { useState, useEffect } from 'react'
import axios from 'axios'

import API_BASE from '../api';
const BASE_URL = API_BASE + '/api/tmdb'
const IMG_BASE = 'https://image.tmdb.org/t/p'

export const getPosterUrl = (path, size = 'w342') =>
  path ? `${IMG_BASE}/${size}${path}` : null

export const getBackdropUrl = (path, size = 'w1280') =>
  path ? `${IMG_BASE}/${size}${path}` : null

const headers = {
  'Content-Type': 'application/json',
}

export function useTMDB(endpoint, params = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    axios
      .get(`${BASE_URL}${endpoint}`, { headers, params })
      .then(res => {
        if (!cancelled) {
          setData(res.data)
          setLoading(false)
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err)
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [endpoint])

  return { data, loading, error }
}

export function useMultiFetch(endpoints) {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    Promise.all(
      endpoints.map(ep =>
        axios.get(`${BASE_URL}${ep}`, { headers }).then(r => r.data)
      )
    ).then(data => {
      if (!cancelled) {
        setResults(data)
        setLoading(false)
      }
    })

    return () => { cancelled = true }
  }, [])

  return { results, loading }
}
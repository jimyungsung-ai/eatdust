import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { isNew, CATEGORIES } from '../App'
import { useLang } from '../LangContext'

const HCMC = [10.7769, 106.6960]

function priceColor(price) {
  if (price < 30000) return '#16a34a'
  if (price <= 50000) return '#d97706'
  return '#dc2626'
}

function priceLabel(price) {
  return price.toLocaleString('vi-VN') + '₫'
}

function makeIcon(spot, selected, rank) {
  const color = priceColor(spot.price)
  const newTag  = isNew(spot) ? '<span class="m-new">NEW</span>' : ''
  const rankTag = rank ? `<span class="m-rank m-rank-${rank}">TOP ${rank}</span>` : ''
  const selClass = selected ? ' selected' : ''
  const emoji = CATEGORIES[spot.category]?.icon ?? '🍽'
  return L.divIcon({
    html: `<div class="m-pin${selClass}" style="--pin-color:${color}">${emoji} ${priceLabel(spot.price)}${newTag}${rankTag}</div>`,
    className: '',
    iconSize: null,
    iconAnchor: [22, 16],
  })
}

const PIN_SVG = (opacity = 1) => `
  <div class="pin-cursor-simple" style="opacity:${opacity}">
    <svg width="22" height="37" viewBox="0 0 44 74" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Stem -->
      <line x1="22" y1="38" x2="22" y2="72" stroke="#888888" stroke-width="3" stroke-linecap="round"/>
      <!-- Ball -->
      <circle cx="22" cy="20" r="19" fill="#ef4444"/>
      <!-- Highlight -->
      <circle cx="29" cy="12" r="6" fill="rgba(255,180,180,0.65)"/>
    </svg>
  </div>`

const CURSOR_PIN_HTML = PIN_SVG(1)
const PLACED_PIN_HTML = PIN_SVG(0.85)

export default function MapView({ spots, selectedId, rankMap = {}, onSelect, onMapClick, loading, pinMode, placedPin }) {
  const { t } = useLang()
  const containerRef  = useRef(null)
  const mapRef        = useRef(null)
  const markersRef    = useRef(new Map())
  const hoverPinRef   = useRef(null)
  const placedPinRef  = useRef(null)
  // Refs so the map click handler always sees the latest values
  const onMapClickRef = useRef(onMapClick)
  const pinModeRef    = useRef(pinMode)
  useEffect(() => { onMapClickRef.current = onMapClick }, [onMapClick])
  useEffect(() => { pinModeRef.current    = pinMode    }, [pinMode])

  // Init map once
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return

    const map = L.map(containerRef.current, {
      center: HCMC,
      zoom: 14,
      zoomControl: false,
    })

    L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`, {
      attribution: '© <a href="https://www.mapbox.com/about/maps/" target="_blank">Mapbox</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
      tileSize: 512,
      zoomOffset: -1,
      maxZoom: 19,
    }).addTo(map)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    map.on('click', e => {
      if (!pinModeRef.current) return   // ignore clicks outside pin mode
      onMapClickRef.current({ lat: e.latlng.lat, lng: e.latlng.lng })
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      markersRef.current.clear()
    }
  }, []) // eslint-disable-line

  // Sync spot markers
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const incoming = new Set(spots.map(s => s.id))

    for (const [id, { marker }] of markersRef.current) {
      if (!incoming.has(id)) {
        marker.remove()
        markersRef.current.delete(id)
      }
    }

    for (const spot of spots) {
      if (markersRef.current.has(spot.id)) continue
      const marker = L.marker([spot.lat, spot.lng], {
        icon: makeIcon(spot, spot.id === selectedId, rankMap[spot.id]),
      })
      marker.on('click', e => {
        L.DomEvent.stopPropagation(e)
        onSelect(spot)
      })
      marker.addTo(map)
      markersRef.current.set(spot.id, { marker, spot })
    }
  }, [spots]) // eslint-disable-line

  // Update selected marker icon + rank badges
  useEffect(() => {
    for (const [id, { marker, spot }] of markersRef.current) {
      marker.setIcon(makeIcon(spot, id === selectedId, rankMap[id]))
    }
  }, [selectedId, rankMap])

  // Pan to selected spot
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedId) return
    const entry = markersRef.current.get(selectedId)
    if (entry) map.panTo([entry.spot.lat, entry.spot.lng], { animate: true, duration: 0.4 })
  }, [selectedId])

  // Pin mode — floating cursor pin + crosshair
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (hoverPinRef.current) {
      hoverPinRef.current.remove()
      hoverPinRef.current = null
    }

    const container = map.getContainer()

    if (!pinMode) {
      container.style.cursor = ''
      return
    }

    container.style.cursor = 'none'

    const hoverIcon = L.divIcon({
      html: CURSOR_PIN_HTML,
      className: '',
      iconSize: [22, 37],
      iconAnchor: [11, 36],
    })

    const hoverMarker = L.marker(map.getCenter(), {
      icon: hoverIcon,
      interactive: false,
      zIndexOffset: 2000,
    }).addTo(map)

    hoverPinRef.current = hoverMarker

    const onMove = (e) => hoverMarker.setLatLng(e.latlng)
    map.on('mousemove', onMove)

    return () => {
      map.off('mousemove', onMove)
      if (hoverPinRef.current) {
        hoverPinRef.current.remove()
        hoverPinRef.current = null
      }
      container.style.cursor = ''
    }
  }, [pinMode])

  // Placed pin marker (shown while form is open)
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (placedPinRef.current) {
      placedPinRef.current.remove()
      placedPinRef.current = null
    }

    if (!placedPin) return

    const icon = L.divIcon({
      html: PLACED_PIN_HTML,
      className: '',
      iconSize: [22, 37],
      iconAnchor: [11, 36],
    })

    placedPinRef.current = L.marker([placedPin.lat, placedPin.lng], {
      icon,
      interactive: false,
      zIndexOffset: 1500,
    }).addTo(map)

    map.panTo([placedPin.lat, placedPin.lng], { animate: true, duration: 0.4 })

    return () => {
      if (placedPinRef.current) {
        placedPinRef.current.remove()
        placedPinRef.current = null
      }
    }
  }, [placedPin])

  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <div ref={containerRef} className="map" />
      {loading && <div className="map-loading">{t.map_loading}</div>}
    </div>
  )
}

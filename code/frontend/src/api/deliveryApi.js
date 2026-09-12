// UTHAO Delivery API Service
// Handles Delivery Agents, Parcel Assignments, Live Status Lifecycle & Tracking Persistence

const STORAGE_KEYS = {
  AGENTS: 'uthao_delivery_agents',
  PARCELS: 'uthao_delivery_parcels',
  ASSIGNMENTS: 'uthao_delivery_assignments',
  HISTORY: 'uthao_delivery_history',
}

// Initial Mock Data
const INITIAL_AGENTS = [
  {
    id: 'agent-101',
    user_id: 'usr-agent-01',
    first_name: 'Kabir',
    last_name: 'Hossain',
    email: 'kabir.delivery@uthao.com',
    phone: '+8801711223344',
    branch_id: 1,
    branch_name: 'Dhaka Central (DHK-01)',
    vehicle_type: 'motorcycle',
    vehicle_plate_number: 'DHAKA-METRO-HA-4592',
    license_number: 'DL-88392019',
    is_available: true,
    current_zone: 'Gulshan & Banani',
    max_parcels_per_day: 25,
    rating: 4.85,
    total_deliveries: 142,
    is_active: true,
  },
  {
    id: 'agent-102',
    user_id: 'usr-agent-02',
    first_name: 'Rakib',
    last_name: 'Ahmed',
    email: 'rakib.delivery@uthao.com',
    phone: '+8801811334455',
    branch_id: 1,
    branch_name: 'Dhaka Central (DHK-01)',
    vehicle_type: 'bike',
    vehicle_plate_number: 'N/A (Bicycle)',
    license_number: 'DL-99201844',
    is_available: true,
    current_zone: 'Dhanmondi & Mirpur',
    max_parcels_per_day: 15,
    rating: 4.92,
    total_deliveries: 210,
    is_active: true,
  },
  {
    id: 'agent-103',
    user_id: 'usr-agent-03',
    first_name: 'Tanvir',
    last_name: 'Islam',
    email: 'tanvir.delivery@uthao.com',
    phone: '+8801911445566',
    branch_id: 2,
    branch_name: 'Chittagong Port (CTG-01)',
    vehicle_type: 'van',
    vehicle_plate_number: 'CHATTO-METRO-GA-1123',
    license_number: 'DL-77301928',
    is_available: false,
    current_zone: 'Agrabad Commercial Zone',
    max_parcels_per_day: 40,
    rating: 4.78,
    total_deliveries: 98,
    is_active: true,
  },
]

const INITIAL_PARCELS = [
  {
    id: 'pcl-901',
    tracking_number: 'UT-892410-DH',
    sender_name: 'Rahim Uddin',
    sender_phone: '+8801700001122',
    receiver_name: 'Farhana Yeasmin',
    receiver_phone: '+8801899887766',
    receiver_email: 'farhana@example.com',
    delivery_address_line1: 'House 42, Road 11, Block D',
    delivery_city: 'Dhaka',
    delivery_state: 'Dhaka',
    delivery_postal_code: '1212',
    category_name: 'electronics',
    weight_kg: 2.5,
    description: 'Wireless Headphones & Accessories',
    status: 'out_for_delivery',
    priority: 'express',
    is_fragile: true,
    delivery_instructions: 'Call receiver before arrival. Deliver to reception if absent.',
    estimated_delivery_date: '2026-09-13',
    delivery_cost: 180.0,
    payment_method: 'cod',
    is_paid: false,
    created_at: '2026-09-12T10:30:00Z',
    updated_at: '2026-09-12T16:20:00Z',
  },
  {
    id: 'pcl-902',
    tracking_number: 'UT-771029-DH',
    sender_name: 'TechMart bd',
    sender_phone: '+8801900112233',
    receiver_name: 'Tanvir Hossain',
    receiver_phone: '+8801755443322',
    receiver_email: 'tanvir.h@example.com',
    delivery_address_line1: 'Flat 4B, Green Villa, Dhanmondi 27',
    delivery_city: 'Dhaka',
    delivery_state: 'Dhaka',
    delivery_postal_code: '1209',
    category_name: 'small_package',
    weight_kg: 1.2,
    description: 'Smart Watch & Leather Strap',
    status: 'picked_up',
    priority: 'standard',
    is_fragile: false,
    delivery_instructions: 'Leave with apartment security guard if gate is locked.',
    estimated_delivery_date: '2026-09-14',
    delivery_cost: 105.0,
    payment_method: 'prepaid',
    is_paid: true,
    created_at: '2026-09-12T11:15:00Z',
    updated_at: '2026-09-12T14:10:00Z',
  },
  {
    id: 'pcl-903',
    tracking_number: 'UT-654321-CTG',
    sender_name: 'StyleCraft Fabrics',
    sender_phone: '+8801811223344',
    receiver_name: 'Anika Rahman',
    receiver_phone: '+8801688776655',
    receiver_email: 'anika.r@example.com',
    delivery_address_line1: 'Plot 18, CDA Avenue',
    delivery_city: 'Chittagong',
    delivery_state: 'Chittagong',
    delivery_postal_code: '4000',
    category_name: 'medium_package',
    weight_kg: 4.5,
    description: 'Cotton Fabric Rolls & Designer Samples',
    status: 'delivered',
    priority: 'standard',
    is_fragile: false,
    delivery_instructions: 'Deliver directly to 3rd floor office.',
    estimated_delivery_date: '2026-09-12',
    actual_delivery_date: '2026-09-12T15:45:00Z',
    delivery_cost: 210.0,
    payment_method: 'prepaid',
    is_paid: true,
    created_at: '2026-09-11T09:00:00Z',
    updated_at: '2026-09-12T15:45:00Z',
  },
]

const INITIAL_ASSIGNMENTS = [
  {
    id: 'asgn-1',
    parcel_id: 'pcl-901',
    agent_id: 'agent-101',
    assignment_type: 'delivery',
    status: 'in_progress',
    assigned_at: '2026-09-12T12:00:00Z',
    notes: 'Out for final mile delivery in Gulshan sector',
  },
  {
    id: 'asgn-2',
    parcel_id: 'pcl-902',
    agent_id: 'agent-102',
    assignment_type: 'pickup',
    status: 'in_progress',
    assigned_at: '2026-09-12T13:30:00Z',
    notes: 'Item picked up from merchant hub',
  },
  {
    id: 'asgn-3',
    parcel_id: 'pcl-903',
    agent_id: 'agent-103',
    assignment_type: 'delivery',
    status: 'completed',
    assigned_at: '2026-09-12T10:00:00Z',
    completed_at: '2026-09-12T15:45:00Z',
    notes: 'Delivered successfully to receiver Ms. Anika',
  },
]

const INITIAL_HISTORY = [
  {
    id: 'hist-1',
    parcel_id: 'pcl-901',
    status: 'booked',
    location: 'UTHAO Hub - Gulshan Branch',
    notes: 'Parcel booking confirmed online.',
    timestamp: '2026-09-12T10:30:00Z',
  },
  {
    id: 'hist-2',
    parcel_id: 'pcl-901',
    status: 'picked_up',
    location: 'Sender Store, Banani Road 11',
    notes: 'Agent Kabir Hossain scanned parcel.',
    timestamp: '2026-09-12T12:15:00Z',
  },
  {
    id: 'hist-3',
    parcel_id: 'pcl-901',
    status: 'in_transit',
    location: 'Central Distribution Warehouse',
    notes: 'Sorted & dispatched to local hub.',
    timestamp: '2026-09-12T14:40:00Z',
  },
  {
    id: 'hist-4',
    parcel_id: 'pcl-901',
    status: 'out_for_delivery',
    location: 'Gulshan Delivery Zone',
    notes: 'Rider on route to destination address.',
    timestamp: '2026-09-12T16:20:00Z',
  },
]

// ── Storage Helpers ─────────────────────────────────────────────────────────
function getStorage(key, fallback) {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : fallback
  } catch {
    return fallback
  }
}

function setStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // fallback if storage disabled
  }
}

// Initialize persistence
export function initDeliveryStore() {
  if (!localStorage.getItem(STORAGE_KEYS.AGENTS)) {
    setStorage(STORAGE_KEYS.AGENTS, INITIAL_AGENTS)
  }
  if (!localStorage.getItem(STORAGE_KEYS.PARCELS)) {
    setStorage(STORAGE_KEYS.PARCELS, INITIAL_PARCELS)
  }
  if (!localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS)) {
    setStorage(STORAGE_KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS)
  }
  if (!localStorage.getItem(STORAGE_KEYS.HISTORY)) {
    setStorage(STORAGE_KEYS.HISTORY, INITIAL_HISTORY)
  }
}

initDeliveryStore()

// ── Delivery API Exported Services ──────────────────────────────────────────

export const deliveryApi = {
  // --- Agents ---
  getAgents: async () => {
    return getStorage(STORAGE_KEYS.AGENTS, INITIAL_AGENTS)
  },

  getAgentById: async (agentId) => {
    const agents = getStorage(STORAGE_KEYS.AGENTS, INITIAL_AGENTS)
    return agents.find((a) => a.id === agentId) || agents[0]
  },

  toggleAgentAvailability: async (agentId) => {
    const agents = getStorage(STORAGE_KEYS.AGENTS, INITIAL_AGENTS)
    const updated = agents.map((a) =>
      a.id === agentId ? { ...a, is_available: !a.is_available } : a
    )
    setStorage(STORAGE_KEYS.AGENTS, updated)
    return updated.find((a) => a.id === agentId)
  },

  updateAgentProfile: async (agentId, updates) => {
    const agents = getStorage(STORAGE_KEYS.AGENTS, INITIAL_AGENTS)
    const updated = agents.map((a) =>
      a.id === agentId ? { ...a, ...updates, updated_at: new Date().toISOString() } : a
    )
    setStorage(STORAGE_KEYS.AGENTS, updated)
    return updated.find((a) => a.id === agentId)
  },

  addAgent: async (agentData) => {
    const agents = getStorage(STORAGE_KEYS.AGENTS, INITIAL_AGENTS)
    const newAgent = {
      id: `agent-${Date.now()}`,
      user_id: `usr-${Date.now()}`,
      rating: 5.0,
      total_deliveries: 0,
      is_available: true,
      is_active: true,
      created_at: new Date().toISOString(),
      ...agentData,
    }
    agents.unshift(newAgent)
    setStorage(STORAGE_KEYS.AGENTS, agents)
    return newAgent
  },

  // --- Parcels & Tracking ---
  getParcels: async () => {
    return getStorage(STORAGE_KEYS.PARCELS, INITIAL_PARCELS)
  },

  getParcelByTracking: async (trackingNumber) => {
    const parcels = getStorage(STORAGE_KEYS.PARCELS, INITIAL_PARCELS)
    const cleaned = trackingNumber.trim().toUpperCase()
    const parcel = parcels.find(
      (p) => p.tracking_number.toUpperCase() === cleaned || p.id === cleaned
    )
    if (!parcel) return null

    // Attach history & assignment details
    const history = getStorage(STORAGE_KEYS.HISTORY, INITIAL_HISTORY).filter(
      (h) => h.parcel_id === parcel.id
    )
    const assignments = getStorage(
      STORAGE_KEYS.ASSIGNMENTS,
      INITIAL_ASSIGNMENTS
    ).filter((a) => a.parcel_id === parcel.id)
    const agents = getStorage(STORAGE_KEYS.AGENTS, INITIAL_AGENTS)

    const activeAssignment = assignments[assignments.length - 1]
    const assignedAgent = activeAssignment
      ? agents.find((a) => a.id === activeAssignment.agent_id)
      : null

    return {
      ...parcel,
      history,
      assignment: activeAssignment || null,
      agent: assignedAgent || null,
    }
  },

  bookParcel: async (bookingData) => {
    const parcels = getStorage(STORAGE_KEYS.PARCELS, INITIAL_PARCELS)
    const history = getStorage(STORAGE_KEYS.HISTORY, INITIAL_HISTORY)

    const cityCode = (bookingData.delivery_city || 'DH').slice(0, 3).toUpperCase()
    const randNum = Math.floor(100000 + Math.random() * 900000)
    const tracking_number = `UT-${randNum}-${cityCode}`

    const newParcel = {
      id: `pcl-${Date.now()}`,
      tracking_number,
      status: 'booked',
      is_paid: bookingData.payment_method === 'prepaid',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...bookingData,
    }

    const newHistoryItem = {
      id: `hist-${Date.now()}`,
      parcel_id: newParcel.id,
      status: 'booked',
      location: `${bookingData.delivery_city} Sorting Hub`,
      notes: 'Parcel booking registered in UTHAO system.',
      timestamp: new Date().toISOString(),
    }

    parcels.unshift(newParcel)
    history.push(newHistoryItem)

    setStorage(STORAGE_KEYS.PARCELS, parcels)
    setStorage(STORAGE_KEYS.HISTORY, history)

    return newParcel
  },

  updateParcelStatus: async (parcelId, newStatus, notes = '', location = '') => {
    const parcels = getStorage(STORAGE_KEYS.PARCELS, INITIAL_PARCELS)
    const history = getStorage(STORAGE_KEYS.HISTORY, INITIAL_HISTORY)
    const assignments = getStorage(STORAGE_KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS)
    const agents = getStorage(STORAGE_KEYS.AGENTS, INITIAL_AGENTS)

    const targetParcel = parcels.find((p) => p.id === parcelId)
    if (!targetParcel) throw new Error('Parcel not found')

    const now = new Date().toISOString()

    // Update parcel status
    const updatedParcels = parcels.map((p) => {
      if (p.id === parcelId) {
        return {
          ...p,
          status: newStatus,
          actual_delivery_date: newStatus === 'delivered' ? now : p.actual_delivery_date,
          updated_at: now,
        }
      }
      return p
    })

    // If delivered, update agent stats & assignment completion
    let updatedAssignments = [...assignments]
    let updatedAgents = [...agents]

    if (['delivered', 'failed'].includes(newStatus)) {
      updatedAssignments = assignments.map((a) => {
        if (a.parcel_id === parcelId && a.status !== 'completed') {
          if (newStatus === 'delivered') {
            // increment agent total deliveries
            updatedAgents = updatedAgents.map((ag) =>
              ag.id === a.agent_id
                ? { ...ag, total_deliveries: ag.total_deliveries + 1 }
                : ag
            )
          }
          return {
            ...a,
            status: newStatus === 'delivered' ? 'completed' : 'failed',
            completed_at: now,
            notes: notes || a.notes,
          }
        }
        return a
      })
    }

    // Append to status history
    const historyItem = {
      id: `hist-${Date.now()}`,
      parcel_id: parcelId,
      status: newStatus,
      location: location || `${targetParcel.delivery_city} Zone`,
      notes: notes || `Status updated to ${newStatus.replace('_', ' ')}`,
      timestamp: now,
    }
    history.push(historyItem)

    setStorage(STORAGE_KEYS.PARCELS, updatedParcels)
    setStorage(STORAGE_KEYS.HISTORY, history)
    setStorage(STORAGE_KEYS.ASSIGNMENTS, updatedAssignments)
    setStorage(STORAGE_KEYS.AGENTS, updatedAgents)

    return updatedParcels.find((p) => p.id === parcelId)
  },

  // --- Assignments ---
  getAgentAssignments: async (agentId) => {
    const assignments = getStorage(STORAGE_KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS)
    const parcels = getStorage(STORAGE_KEYS.PARCELS, INITIAL_PARCELS)

    const agentAsgns = assignments.filter((a) => a.agent_id === agentId)
    return agentAsgns.map((a) => {
      const parcel = parcels.find((p) => p.id === a.parcel_id)
      return {
        ...a,
        parcel: parcel || null,
      }
    })
  },

  assignParcelToAgent: async (parcelId, agentId, type = 'delivery', notes = '') => {
    const assignments = getStorage(STORAGE_KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS)
    const parcels = getStorage(STORAGE_KEYS.PARCELS, INITIAL_PARCELS)

    const parcel = parcels.find((p) => p.id === parcelId)
    if (!parcel) throw new Error('Parcel not found')

    const newAssignment = {
      id: `asgn-${Date.now()}`,
      parcel_id: parcelId,
      agent_id: agentId,
      assignment_type: type,
      status: 'in_progress',
      assigned_at: new Date().toISOString(),
      notes: notes || `Assigned for ${type}`,
    }

    // Update parcel status
    const newStatus = type === 'pickup' ? 'picked_up' : 'out_for_delivery'
    const updatedParcels = parcels.map((p) =>
      p.id === parcelId ? { ...p, status: newStatus, updated_at: new Date().toISOString() } : p
    )

    assignments.push(newAssignment)
    setStorage(STORAGE_KEYS.ASSIGNMENTS, assignments)
    setStorage(STORAGE_KEYS.PARCELS, updatedParcels)

    return newAssignment
  },

  // --- Utility Pricing Calculator ---
  calculateDeliveryCost: (weightKg, category, priority) => {
    const baseRates = {
      document: 50,
      small_package: 80,
      medium_package: 120,
      large_package: 200,
      fragile: 150,
      perishable: 180,
      electronics: 160,
    }
    const perKgRates = {
      document: 10,
      small_package: 25,
      medium_package: 20,
      large_package: 15,
      fragile: 35,
      perishable: 30,
      electronics: 30,
    }
    const priorityMultipliers = {
      standard: 1.0,
      express: 1.5,
      overnight: 2.2,
    }

    const base = baseRates[category] || 80
    const perKg = perKgRates[category] || 20
    const mult = priorityMultipliers[priority] || 1.0

    const rawCost = (base + Math.max(0, weightKg - 1) * perKg) * mult
    return Math.round(rawCost)
  },
}

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const OILPRICE_API_KEY = Deno.env.get('OILPRICE_API_KEY')
const OILPRICE_API_URL = 'https://api.oilpriceapi.com/v1/prices/latest'

interface OilPriceResponse {
  status: string
  data: {
    price: number
    formatted: string
    currency: string
    code: string
    type: string
    created_at: string
  }
}

serve(async (req) => {
  try {
    if (!OILPRICE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Oilprice API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Make request to OilpriceAPI
    const response = await fetch(OILPRICE_API_URL, {
      headers: {
        'Authorization': `Token ${OILPRICE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Oilprice API error: ${error}`)
    }

    const data: OilPriceResponse = await response.json()

    // Format the response
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          price: data.data.price,
          formatted: data.data.formatted,
          currency: data.data.currency,
          type: data.data.code,
          last_updated: data.data.created_at
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error fetching oil price:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to fetch oil price' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

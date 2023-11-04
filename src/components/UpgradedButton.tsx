"use client"

import { ArrowRight } from 'lucide-react'
import { Button } from './ui/button'
import { trpc } from '@/app/_trpc/client'

interface buttonProps {
  isDisabled?: boolean
}

const UpgradeButton = ({ isDisabled }: buttonProps) => {

  const {mutate: createStripeSession} = trpc.createStripeSession.useMutation({
    onSuccess: ({url}) => {
      window.location.href = url ?? "/dashboard/billing"
    }
  })

  return (
    <Button disabled={isDisabled} onClick={() => createStripeSession()} className='w-full'>
      Upgrade now <ArrowRight className='h-5 w-5 ml-1.5' />
    </Button>
  )
}

export default UpgradeButton
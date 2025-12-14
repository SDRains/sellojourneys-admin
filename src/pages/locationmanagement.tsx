import NavbarComponent from "@/components/NavbarComponent"
import { GetAllActiveLocations } from "@/lib/hasura/queries/Locations"
import { SetLocationToInactive } from "@/lib/hasura/mutations/Locations";
import {useMutation, useQuery} from "@apollo/client/react"
import { useState } from "react"
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'

// TypeScript interfaces based on your GraphQL query
interface Location {
    id: string
    name: string
    hero_image: string
    city: string
    state: string
    stamp: {
        stamp_image: string
    }
}

interface LocationsData {
    locations: Location[]
}

export default function LocationManagementPage() {
    const { loading, error, data, refetch: refetchLocations } = useQuery<LocationsData>(GetAllActiveLocations)
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const handleLocationClick = (location: Location) => {
        setSelectedLocation(location)
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setSelectedLocation(null)
    }

    if (loading) {
        return (
            <>
                <NavbarComponent activeTab='Location Management' />
                <div className='max-w-7xl mx-auto pt-8'>
                    <p className="text-center text-gray-500">Loading locations...</p>
                </div>
            </>
        )
    }

    if (error) {
        return (
            <>
                <NavbarComponent activeTab='Location Management' />
                <div className='max-w-7xl mx-auto pt-8'>
                    <p className="text-center text-red-500">Error loading locations: {error.message}</p>
                </div>
            </>
        )
    }

    return (
        <>
            <NavbarComponent activeTab='Location Management' />

            <div className='max-w-7xl mx-auto pt-8 px-4'>
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Location Management</h1>
                    <p className="text-gray-600">Manage all active locations</p>
                </div>

                {data && data.locations.length > 0 ? (
                    <ul role="list" className="divide-y divide-gray-100 bg-white rounded-lg shadow-2xl mb-24">
                        {data.locations.map((location, index) => (
                            <li
                                key={`${location.name}-${index}`}
                                onClick={() => handleLocationClick(location)}
                                className="flex justify-between gap-x-6 py-5 px-6 cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex min-w-0 gap-x-4">
                                    <img
                                        alt={`${location.name} hero image`}
                                        src={`https://questica.s3.us-east-1.amazonaws.com/location_images/${location.hero_image}`}
                                        className="w-20 h-12 flex-none rounded-lg bg-gray-100 object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement
                                            target.src = '/placeholder-location.jpg'
                                        }}
                                    />
                                    <div className="min-w-0 flex-auto">
                                        <p className="text-sm/6 font-semibold text-gray-900">
                                            {location.name}
                                        </p>
                                        <p className="mt-1 truncate text-xs/5 text-gray-500">
                                            {location.city}, {location.state}
                                        </p>
                                    </div>
                                </div>
                                <div className="hidden shrink-0 sm:flex sm:flex-col sm:items-end">
                                    <div className='flex items-center gap-4'>
                                        <div className="text-right">
                                            <img
                                                alt={`${location.name} stamp`}
                                                src={'https://questica.s3.us-east-1.amazonaws.com/stamps/' + location.stamp.stamp_image}
                                                className="size-12 flex-none object-cover border border-gray-200"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement
                                                    target.src = '/placeholder-stamp.jpg'
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No active locations found</p>
                        <button
                            onClick={() => refetchLocations()}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Refresh
                        </button>
                    </div>
                )}
            </div>

            {/* Modal */}
            {selectedLocation && (
                <LocationDetailsModal
                    location={selectedLocation}
                    isOpen={isModalOpen}
                    onClose={closeModal}
                />
            )}
        </>
    )
}

interface LocationDetailsProps {
    location: Location
    isOpen: boolean
    onClose: () => void
}

function LocationDetailsModal({ location, isOpen, onClose }: LocationDetailsProps) {
    const [setToInactive] = useMutation(SetLocationToInactive)

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-10">
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
            />

            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                    <DialogPanel
                        transition
                        className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg sm:p-6 data-closed:sm:translate-y-0 data-closed:sm:scale-95"
                    >
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {location.name}
                                </h3>
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                >
                                    <span className="sr-only">Close</span>
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <img
                                        alt={`${location.name} hero image`}
                                        src={`https://questica.s3.us-east-1.amazonaws.com/location_images/${location.hero_image}`}
                                        className="w-full h-auto rounded-lg bg-gray-100 object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement
                                            target.src = '/placeholder-location.jpg'
                                        }}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Location</p>
                                        <p className="text-lg font-medium text-gray-900">
                                            {location.city}, {location.state}
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <p className="text-sm text-gray-500 mb-1">Stamp</p>
                                        <img
                                            alt={`${location.name} stamp`}
                                            src={`https://questica.s3.us-east-1.amazonaws.com/stamps/${location.stamp.stamp_image}`}
                                            className="w-16 h-16 bg-gray-100 object-cover border-2 border-gray-200 cursor-pointer"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement
                                                target.src = '/placeholder-stamp.jpg'
                                            }}
                                            onClick={() => window.open(`https://questica.s3.us-east-1.amazonaws.com/stamps/${location.stamp.stamp_image}`)}
                                        />
                                    </div>
                                </div>

                                <div className='mt-4 border-t border-neutral-300 border-dashed pt-2'>
                                    <p className="text-sm text-gray-500">
                                        Stamp Image Name
                                    </p>
                                    <p className="text-lg font-medium text-gray-900">
                                        {location.stamp.stamp_image.slice(0, -4)}
                                    </p>
                                </div>

                                <div className='mt-4 border-t border-neutral-300 border-dashed pt-2'>
                                    <div className='w-fit'>
                                        <div
                                            className='bg-red-600 hover:bg-red-600/80 text-white py-2 px-8 font-semibold rounded-lg cursor-pointer text-center'
                                            onClick={async () => {
                                                await setToInactive({ variables: { location: location.id}})
                                                onClose()
                                            }}
                                        >
                                            <p>Set to Inactive</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 cursor-pointer"
                                >
                                    Close
                                </button>
                                {/*<button*/}
                                {/*    type="button"*/}
                                {/*    className="inline-flex justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 cursor-pointer"*/}
                                {/*>*/}
                                {/*    Edit Location*/}
                                {/*</button>*/}
                            </div>
                        </div>
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    )
}
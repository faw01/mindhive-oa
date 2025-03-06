'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import Chatbot from '@/components/Chatbot';

// Dynamically import the Map component to avoid SSR issues
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <Card className="w-full h-[600px] rounded-lg overflow-hidden flex items-center justify-center">
      <p className="text-muted-foreground">Loading map...</p>
    </Card>
  ),
});

// Types
interface Outlet {
  id: number;
  name: string;
  address: string;
  operating_hours: string;
  lat: number;
  long: number;
  distance?: number;
  intersects_with?: number[];
  waze_link: string;
  google_maps_link: string;
}

export default function Home() {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  const [showCatchmentAreas, setShowCatchmentAreas] = useState(false);
  const [catchmentRadius, setCatchmentRadius] = useState(5);
  const [intersectingOutlets, setIntersectingOutlets] = useState<Outlet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch outlets data
  useEffect(() => {
    const fetchOutlets = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/outlets/');
        const data = await response.json();
        setOutlets(data);
      } catch (error) {
        console.error('Error fetching outlets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOutlets();
  }, []);

  // Fetch intersecting outlets when an outlet is selected
  useEffect(() => {
    if (!selectedOutlet) {
      setIntersectingOutlets([]);
      return;
    }

    const fetchIntersectingOutlets = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/outlets/catchment/?outlet_id=${selectedOutlet.id}&radius=${catchmentRadius}`);
        const data = await response.json();
        // Filter outlets within the catchment radius
        const filteredData = data.filter((outlet: Outlet) => outlet.distance && outlet.distance <= catchmentRadius);
        setIntersectingOutlets(filteredData);
      } catch (error) {
        console.error('Error fetching intersecting outlets:', error);
      }
    };

    fetchIntersectingOutlets();
  }, [selectedOutlet, catchmentRadius]);

  const handleOutletClick = (outlet: Outlet) => {
    if (selectedOutlet?.id === outlet.id) {
      setSelectedOutlet(null);
    } else {
      setSelectedOutlet(outlet);
    }
  };

  return (
    <main className="container mx-auto p-4 space-y-4">
      <div className="flex justify-center mb-8">
        <Image
          src="/subway-logo.svg" 
          alt="Subway Logo" 
          width={240} 
          height={48} 
          priority
          className="h-12 w-auto"
        />
      </div>

      {/* Chatbot Section */}
      <div className="w-full mb-6">
        <Card className="border shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Image 
                src="/subway-logo-small.svg" 
                alt="Subway Logo" 
                width={60}
                height={12}
                className="w-auto h-4"
              />
              Assistant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Chatbot embedded={true} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Outlet Map</CardTitle>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Radius:</span>
                    <Slider
                      value={[catchmentRadius]}
                      onValueChange={([value]: [number]) => setCatchmentRadius(value)}
                      min={0.5}
                      max={5}
                      step={0.5}
                      className="w-32"
                      defaultValue={[5]}
                      disabled={!showCatchmentAreas}
                    />
                    <span className="text-sm">{catchmentRadius}km</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show-catchment"
                      checked={showCatchmentAreas}
                      onCheckedChange={setShowCatchmentAreas}
                    />
                    <label htmlFor="show-catchment">Show Catchment Areas</label>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[600px] w-full">
                <Map
                  outlets={outlets}
                  selectedOutlet={selectedOutlet}
                  catchmentRadius={catchmentRadius}
                  onOutletClick={handleOutletClick}
                  showCatchmentAreas={showCatchmentAreas}
                  mapStyle="mapbox://styles/mapbox/streets-v12"
                  margin={{ l: 0, r: 0, t: 0, b: 0 }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Outlet Information Section */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Outlet Information</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex flex-col" style={{ height: "calc(600px - 57px)" }}>
              <Tabs defaultValue="list" className="w-full">
                <div className="px-6 py-2 border-b">
                  <TabsList className="w-full">
                    <TabsTrigger value="list">All Outlets</TabsTrigger>
                    <TabsTrigger value="selected">Selected Outlet</TabsTrigger>
                  </TabsList>
                </div>
                <div className="flex-1 overflow-auto">
                  <TabsContent value="list" className="m-0 p-6 h-full overflow-y-auto max-h-[550px]">
                    {isLoading ? (
                      <p className="text-center text-muted-foreground">Loading outlets...</p>
                    ) : (
                      <div className="space-y-2">
                        {outlets.map(outlet => (
                          <Button
                            key={outlet.id}
                            variant={selectedOutlet?.id === outlet.id ? "default" : "outline"}
                            className="w-full justify-start"
                            onClick={() => handleOutletClick(outlet)}
                          >
                            {outlet.name}
                          </Button>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="selected" className="m-0 p-6 h-full">
                    {selectedOutlet ? (
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg">{selectedOutlet.name}</h3>
                        <p className="text-sm text-muted-foreground">{selectedOutlet.address}</p>
                        <p className="text-sm">{selectedOutlet.operating_hours}</p>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex items-center gap-2 flex-1"
                            onClick={() => window.open(selectedOutlet.waze_link, '_blank')}
                          >
                            <svg className="h-5 w-5" viewBox="0 0 200 200">
                              <g>
                                <path fill="currentColor" d="M99.513,76.832c0,4.719-3.825,8.545-8.544,8.545c-4.718,0-8.544-3.826-8.544-8.545   c0-4.719,3.826-8.543,8.544-8.543C95.688,68.289,99.513,72.112,99.513,76.832"/>
                                <path fill="currentColor" d="M139.43,76.832c0,4.719-3.826,8.545-8.545,8.545c-4.718,0-8.544-3.826-8.544-8.545   c0-4.719,3.826-8.543,8.544-8.543C135.604,68.289,139.43,72.112,139.43,76.832"/>
                                <path fill="currentColor" d="M110.621,122.646c-14.477,0-27.519-9.492-29.911-21.917c-0.464-2.412,1.116-4.745,3.528-5.209   c2.413-0.465,4.745,1.116,5.209,3.528c1.406,7.304,10.152,14.996,21.81,14.691c12.144-0.318,20.165-7.58,21.813-14.588   c0.563-2.391,2.961-3.872,5.35-3.312c2.393,0.563,3.875,2.958,3.312,5.349c-1.346,5.721-5.03,11.021-10.375,14.926   c-5.567,4.07-12.438,6.324-19.866,6.52C111.201,122.643,110.91,122.646,110.621,122.646"/>
                                <path fill="currentColor" d="M183.97,81.47c-1.644-9.71-5.5-18.811-11.464-27.051c-6.736-9.307-15.951-17.078-26.648-22.472   c-10.812-5.452-22.88-8.335-34.9-8.335c-3.391,0-6.809,0.23-10.16,0.682c-14.034,1.896-27.833,7.734-38.856,16.439   c-12.42,9.808-20.435,22.418-23.177,36.469C37.948,81.379,37.6,86,37.263,90.468c-0.528,6.994-1.074,14.226-3.298,18.952   c-1.52,3.23-3.788,5.381-9.919,5.381c-3.374,0-6.457,1.908-7.963,4.928c-1.505,3.02-1.173,6.631,0.857,9.324   c9.237,12.254,21.291,19.676,33.982,24.148c-0.578,1.746-0.903,3.605-0.903,5.545c0,9.744,7.899,17.643,17.643,17.643   c9.503,0,17.229-7.518,17.606-16.928c4.137,0.225,23.836,0.279,26.033,0.217c0.487,9.309,8.167,16.711,17.596,16.711   c9.743,0,17.642-7.898,17.642-17.643c0-2.221-0.428-4.338-1.176-6.295c6.918-3.365,13.448-7.906,19.146-13.375   c7.946-7.625,13.778-16.621,16.868-26.016C184.854,102.486,185.728,91.857,183.97,81.47 M67.662,164.568   c-3.215,0-5.822-2.605-5.822-5.822c0-3.215,2.607-5.822,5.822-5.822c3.216,0,5.822,2.607,5.822,5.822   C73.484,161.963,70.878,164.568,67.662,164.568 M128.897,164.568c-3.216,0-5.823-2.605-5.823-5.822   c0-3.215,2.607-5.822,5.823-5.822s5.822,2.607,5.822,5.822C134.72,161.963,132.113,164.568,128.897,164.568 M172.925,110.281   c-5.095,15.49-18.524,28.281-32.835,34.83c-3.047-2.504-6.943-4.006-11.192-4.006c-6.848,0-12.771,3.906-15.694,9.607   c-2.976,0.123-25.135,0.047-29.984-0.285c-2.972-5.547-8.822-9.322-15.557-9.322c-4.48,0-8.559,1.682-11.669,4.434   c-12.054-3.895-23.438-10.551-31.947-21.842c25.161,0,20.196-28.118,23.451-44.792c4.959-25.412,30.099-42.499,54.491-45.794   c3-0.405,6-0.602,8.969-0.602C151.047,32.51,186.732,68.302,172.925,110.281"/>
                              </g>
                            </svg>
                            Waze
                          </Button>
                          <Button
                            variant="outline"
                            className="flex items-center gap-2 flex-1"
                            onClick={() => window.open(selectedOutlet.google_maps_link, '_blank')}
                          >
                            <svg className="h-5 w-5" viewBox="0 0 92.3 132.3">
                              <path fill="#1a73e8" d="M60.2 2.2C55.8.8 51 0 46.1 0 32 0 19.3 6.4 10.8 16.5l21.8 18.3L60.2 2.2z"/>
                              <path fill="#ea4335" d="M10.8 16.5C4.1 24.5 0 34.9 0 46.1c0 8.7 1.7 15.7 4.6 22l28-33.3-21.8-18.3z"/>
                              <path fill="#4285f4" d="M46.2 28.5c9.8 0 17.7 7.9 17.7 17.7 0 4.3-1.6 8.3-4.2 11.4 0 0 13.9-16.6 27.5-32.7-5.6-10.8-15.3-19-27-22.7L32.6 34.8c3.3-3.8 8.1-6.3 13.6-6.3"/>
                              <path fill="#fbbc04" d="M46.2 63.8c-9.8 0-17.7-7.9-17.7-17.7 0-4.3 1.5-8.3 4.1-11.3l-28 33.3c4.8 10.6 12.8 19.2 21 29.9l34.1-40.5c-3.3 3.9-8.1 6.3-13.5 6.3"/>
                              <path fill="#34a853" d="M59.1 109.2c15.4-24.1 33.3-35 33.3-63 0-7.7-1.9-14.9-5.2-21.3L25.6 98c2.6 3.4 5.3 7.3 7.9 11.3 9.4 14.5 6.8 23.1 12.8 23.1s3.4-8.7 12.8-23.2"/>
                            </svg>
                            Maps
                          </Button>
                        </div>
                        
                        <div className="pt-4">
                          <h4 className="font-semibold mb-2">Intersecting Outlets</h4>
                          {intersectingOutlets.length > 0 ? (
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                              {intersectingOutlets.map(outlet => (
                                <Dialog key={outlet.id}>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start">
                                      {outlet.name}
                                      <span className="ml-auto text-sm text-muted-foreground">
                                        {outlet.distance?.toFixed(2)} km
                                      </span>
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>{outlet.name}</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-2">
                                      <p className="text-sm">{outlet.address}</p>
                                      <p className="text-sm font-medium">{outlet.operating_hours}</p>
                                      <p className="text-sm text-muted-foreground">
                                        Distance: {outlet.distance?.toFixed(2)} km
                                      </p>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No outlets within {catchmentRadius}km radius
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Select an outlet to view details</p>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* MindHive Footer */}
      <div className="mt-12 pt-8 border-t border-border">
        <div className="flex flex-col items-center justify-center space-y-4">
          <p className="text-center text-muted-foreground">
            This application was developed as part of the MindHive Technical Assessment by <a href="https://faw.dev" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Faw</a>
          </p>
          <a href="https://www.mindhive.asia" target="_blank" rel="noopener noreferrer">
            <Image
              src="/mindhive.png" 
              alt="MindHive Logo" 
              width={200} 
              height={100} 
              className="h-12 w-auto"
            />
          </a>
        </div>
    </div>
    </main>
  );
}

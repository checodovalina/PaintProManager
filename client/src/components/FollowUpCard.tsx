import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { PhoneOutgoing, Calendar, Info, AlertTriangle } from "lucide-react";
import { Client } from "@shared/schema";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FollowUpCardProps {
  clients: Client[];
  onFollowUp: (client: Client, notes: string, nextFollowUpDate: Date) => void;
  isLoading: boolean;
}

export default function FollowUpCard({ clients, onFollowUp, isLoading }: FollowUpCardProps) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState<Date>(
    new Date(new Date().setDate(new Date().getDate() + 7)) // Default to 7 days later
  );
  
  const handleFollowUpSubmit = () => {
    if (selectedClient) {
      onFollowUp(selectedClient, followUpNotes, nextFollowUpDate);
      setSelectedClient(null);
      setFollowUpNotes("");
    }
  };
  
  const handleFollowUpOpen = (client: Client) => {
    setSelectedClient(client);
    setFollowUpNotes("");
    setNextFollowUpDate(new Date(new Date().setDate(new Date().getDate() + 7)));
  };
  
  // Sort clients by follow-up date (earliest first)
  const sortedClients = [...clients].sort((a, b) => {
    if (!a.nextFollowUp) return 1;
    if (!b.nextFollowUp) return -1;
    return new Date(a.nextFollowUp).getTime() - new Date(b.nextFollowUp).getTime();
  });
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
            Follow-up Required
          </CardTitle>
          <CardDescription>
            Prospects requiring follow-up contact
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            sortedClients.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No follow-ups required at this time
              </div>
            ) : (
              <div className="space-y-4">
                {sortedClients.map((client) => (
                  <div key={client.id} className="flex justify-between items-start border-b pb-3">
                    <div>
                      <div className="font-medium">{client.name}</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Info className="h-3 w-3 mr-1" />
                        <Badge variant="outline" className={client.type === "residential" 
                          ? "bg-blue-100 text-blue-800" 
                          : client.type === "commercial" 
                            ? "bg-purple-100 text-purple-800" 
                            : "bg-orange-100 text-orange-800"
                          }
                        >
                          {client.type.charAt(0).toUpperCase() + client.type.slice(1)}
                        </Badge>
                        
                        <span className="mx-2">•</span>
                        
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {client.nextFollowUp && format(new Date(client.nextFollowUp), "MMM d, yyyy")}
                        </span>
                        
                        {client.phone && (
                          <>
                            <span className="mx-2">•</span>
                            <span className="flex items-center">
                              <PhoneOutgoing className="h-3 w-3 mr-1" />
                              {client.phone}
                            </span>
                          </>
                        )}
                      </div>
                      {client.notes && (
                        <div className="text-sm mt-1 text-gray-600 italic">
                          "{client.notes.length > 100 
                            ? client.notes.substring(0, 100) + "..." 
                            : client.notes}"
                        </div>
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleFollowUpOpen(client)}
                      variant="outline"
                      className="shrink-0"
                    >
                      <PhoneOutgoing className="mr-2 h-4 w-4" />
                      Record Contact
                    </Button>
                  </div>
                ))}
              </div>
            )
          )}
        </CardContent>
        <CardFooter className="border-t pt-3">
          <Button variant="link" className="w-full" onClick={() => {}}>
            View all prospects
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={!!selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Follow-up Contact</DialogTitle>
            <DialogDescription>
              {selectedClient && (
                <>
                  Recording follow-up with {selectedClient.name} ({selectedClient.type})
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Enter details of the conversation"
                value={followUpNotes}
                onChange={(e) => setFollowUpNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="next-date">Next Follow-up Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !nextFollowUpDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {nextFollowUpDate ? (
                      format(nextFollowUpDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={nextFollowUpDate}
                    onSelect={(date: Date | undefined) => date && setNextFollowUpDate(date)}
                    disabled={(date: Date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setSelectedClient(null)}
            >
              Cancel
            </Button>
            <Button onClick={handleFollowUpSubmit}>
              Save Follow-up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
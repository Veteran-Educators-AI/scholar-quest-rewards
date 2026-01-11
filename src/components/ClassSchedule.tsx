import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Calendar, Clock, MapPin, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ClassPeriod {
  id: string;
  name: string;
  subject: string;
  teacher: string;
  room: string;
  startTime: string;
  endTime: string;
  dayOfWeek: number;
  color: string;
}

// Demo schedule data
const demoSchedule: ClassPeriod[] = [
  {
    id: "1",
    name: "Math",
    subject: "Mathematics",
    teacher: "Mr. Johnson",
    room: "Room 201",
    startTime: "8:00 AM",
    endTime: "8:50 AM",
    dayOfWeek: 1,
    color: "bg-blue-500",
  },
  {
    id: "2",
    name: "English",
    subject: "English Language Arts",
    teacher: "Ms. Williams",
    room: "Room 105",
    startTime: "9:00 AM",
    endTime: "9:50 AM",
    dayOfWeek: 1,
    color: "bg-green-500",
  },
  {
    id: "3",
    name: "Science",
    subject: "Earth Science",
    teacher: "Dr. Martinez",
    room: "Lab 302",
    startTime: "10:00 AM",
    endTime: "10:50 AM",
    dayOfWeek: 1,
    color: "bg-purple-500",
  },
  {
    id: "4",
    name: "History",
    subject: "Social Studies",
    teacher: "Mrs. Brown",
    room: "Room 208",
    startTime: "11:00 AM",
    endTime: "11:50 AM",
    dayOfWeek: 1,
    color: "bg-orange-500",
  },
  {
    id: "5",
    name: "Lunch",
    subject: "Break",
    teacher: "",
    room: "Cafeteria",
    startTime: "12:00 PM",
    endTime: "12:45 PM",
    dayOfWeek: 1,
    color: "bg-gray-400",
  },
  {
    id: "6",
    name: "Art",
    subject: "Visual Arts",
    teacher: "Mr. Chen",
    room: "Art Studio",
    startTime: "1:00 PM",
    endTime: "1:50 PM",
    dayOfWeek: 1,
    color: "bg-pink-500",
  },
  {
    id: "7",
    name: "PE",
    subject: "Physical Education",
    teacher: "Coach Davis",
    room: "Gym",
    startTime: "2:00 PM",
    endTime: "2:50 PM",
    dayOfWeek: 1,
    color: "bg-red-500",
  },
];

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function ClassSchedule() {
  const [schedule] = useState<ClassPeriod[]>(demoSchedule);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  
  // Get current time to highlight current class
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const isCurrentClass = (startTime: string, endTime: string) => {
    const parseTime = (time: string) => {
      const [timePart, period] = time.split(" ");
      let [hours, minutes] = timePart.split(":").map(Number);
      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    const currentMinutes = currentHour * 60 + currentMinute;
    const start = parseTime(startTime);
    const end = parseTime(endTime);

    return currentMinutes >= start && currentMinutes < end && selectedDay === now.getDay();
  };

  // Filter schedule for selected day (using modulo to simulate week)
  const daySchedule = schedule;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Today's Schedule
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {days[selectedDay]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Day selector */}
        <ScrollArea className="w-full mb-4">
          <div className="flex gap-2 pb-2">
            {days.slice(1, 6).map((day, index) => {
              const dayIndex = index + 1;
              const isToday = dayIndex === now.getDay();
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(dayIndex)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedDay === dayIndex
                      ? "bg-primary text-primary-foreground"
                      : isToday
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Schedule list */}
        <div className="space-y-2">
          {daySchedule.map((period, index) => {
            const isCurrent = isCurrentClass(period.startTime, period.endTime);
            
            return (
              <motion.div
                key={period.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`relative flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  isCurrent
                    ? "bg-primary/10 border-2 border-primary"
                    : "bg-muted/50 hover:bg-muted"
                }`}
              >
                {/* Color indicator */}
                <div className={`w-1 h-12 rounded-full ${period.color}`} />

                {/* Time */}
                <div className="flex flex-col items-center min-w-[60px]">
                  <span className="text-xs font-semibold text-foreground">
                    {period.startTime.replace(" ", "")}
                  </span>
                  <span className="text-[10px] text-muted-foreground">to</span>
                  <span className="text-xs text-muted-foreground">
                    {period.endTime.replace(" ", "")}
                  </span>
                </div>

                {/* Class info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-foreground truncate">
                      {period.name}
                    </h4>
                    {isCurrent && (
                      <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0">
                        NOW
                      </Badge>
                    )}
                  </div>
                  {period.teacher && (
                    <p className="text-xs text-muted-foreground truncate">
                      {period.teacher}
                    </p>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{period.room}</span>
                  </div>
                </div>

                {/* Subject icon */}
                <div className={`w-10 h-10 rounded-lg ${period.color}/20 flex items-center justify-center`}>
                  <BookOpen className={`w-5 h-5 ${period.color.replace("bg-", "text-")}`} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

import { useState, useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Calendar from "react-calendar";
import axiosInstance from "../lib/axios.js";
import "react-calendar/dist/Calendar.css";
import "./Interview.css";
import useUserStore from "../stores/useUserStore.js";

export default function Interview() {
  const [availableDates, setAvailableDates] = useState([]);
  const [date, setDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, checkUserAuth } = useUserStore();

  useEffect(() => {
    fetchAvailableDates();
  }, []);

  const fetchAvailableDates = async () => {
    try {
      const response = await axiosInstance.get("/user/available-slots");
      const slotData = response.data.data;
      const availableDatesList = [
        ...new Set(
          slotData.map(
            (slot) => new Date(slot.time).toISOString().split("T")[0]
          )
        ),
      ];
      setAvailableDates(availableDatesList);
    } catch (err) {
      toast.error("Error fetching available dates");
    }
  };

  if (!location.state?.allowed || user.slot) {
    return <Navigate to="/" />;
  }

  const fetchSlots = async (selectedDate) => {
    setLoading(true);
    try {
      const formattedDate = selectedDate.toISOString().split("T")[0];
      const response = await axiosInstance.get(
        `/user/available-slots?date=${formattedDate}`
      );

      const filteredSlots = response.data.data.filter(
        (slot) =>
          new Date(slot.time).toISOString().split("T")[0] === formattedDate
      );

      setSlots(filteredSlots);
      console.log(filteredSlots);
    } catch (err) {
      toast.error("Error fetching slots:");
    }
    setLoading(false);
  };

  const handleDateChange = (selectedDate) => {
    const formattedDate = selectedDate.toISOString().split("T")[0];

    if (availableDates.includes(formattedDate)) {
      setDate(selectedDate);
      setSelectedSlot(null);
      fetchSlots(selectedDate);
    } else {
      setSlots([]);
      setSelectedSlot(null);
    }
  };

  const handleSlotSelection = (slot) => {
    setSelectedSlot(slot);
  };

  const handleSubmit = async () => {
    if (!selectedSlot) {
      toast.error("Please select a time slot!");
      return;
    }

    try {
      await axiosInstance.put(`/user/select-slot/${selectedSlot._id}`);
      toast.success("Slot booked successfully!");
      await checkUserAuth();
      navigate("/meet", { state: { allowed: true } });
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong!");
    }
  };

  return (
    <div className="container">
      <div className="Int-heading">Interview Slot</div>
      <div className="booking-wrapper">
        <section className="calendar-section">
          <Calendar
            onChange={handleDateChange}
            value={date}
            tileDisabled={({ date }) => {
              const formattedDate = date.toISOString().split("T")[0];
              return !availableDates.includes(formattedDate);
            }}
          />
        </section>

        <section className="slots-section">
          <h3>Available Slots</h3>
          {loading ? (
            <p>Loading slots...</p>
          ) : slots.length > 0 ? (
            <div className="slots-container">
              {slots.map((slot, index) => (
                <button
                  key={index}
                  className={`slot-button ${
                    selectedSlot === slot ? "selected" : ""
                  }`}
                  onClick={() => handleSlotSelection(slot)}
                >
                  {new Date(slot.time).toLocaleTimeString()}
                </button>
              ))}
            </div>
          ) : (
            <p>No slots available</p>
          )}
        </section>
      </div>

      <button className="submit-button" onClick={handleSubmit}>
        Book Slot
      </button>
    </div>
  );
}

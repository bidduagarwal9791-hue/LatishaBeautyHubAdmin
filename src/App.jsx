import { useEffect, useRef, useState } from "react";
import "./App.css";
import { db } from "./firebase";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";

const BOOKINGS_COLLECTION = "bookings";
const SERVICES_COLLECTION = "services";
const SIDERS_COLLECTION = "siders";


const defaultServices = [
  {
    id: "service-1",
    name: "Bridal Makeup",
    category: "Bridal",
    rate: 25000,
  },
  {
    id: "service-2",
    name: "Reception Makeup",
    category: "Bridal",
    rate: 15000,
  },
  {
    id: "service-3",
    name: "Haldi Makeup",
    category: "Bridal",
    rate: 5000,
  },
  {
    id: "service-4",
    name: "Sider Makeup",
    category: "Siders",
    rate: 3500,
  },
  {
    id: "service-5",
    name: "Hair Styling",
    category: "Siders",
    rate: 2000,
  },
  {
    id: "service-6",
    name: "Saree Draping",
    category: "Siders",
    rate: 1500,
  },
];

const defaultSiders = [
  {
    id: "sider-1",
    name: "Makeup Only",
    rate: 3500,
  },
  {
    id: "sider-2",
    name: "Hair Styling Only",
    rate: 2000,
  },
  {
    id: "sider-3",
    name: "Saree Draping Only",
    rate: 1500,
  },
  {
    id: "sider-4",
    name: "Makeup + Hair",
    rate: 5000,
  },
  {
    id: "sider-5",
    name: "Makeup + Saree Draping",
    rate: 5000,
  },
  {
    id: "sider-6",
    name: "Full Package",
    rate: 7000,
  },
];

const emptyBooking = {
  brideName: "",
  mobile: "",
  eventDate: "",
  venue: "",
  functionName: "",
  service: "",
  amount: 0,

  makeupOnlyPersons: 0,
  makeupOnlyRate: 0,

  hairStylingPersons: 0,
  hairStylingRate: 0,

  sareeDrapingPersons: 0,
  sareeDrapingRate: 0,

  makeupHairPersons: 0,
  makeupHairRate: 0,

  makeupSareePersons: 0,
  makeupSareeRate: 0,

  fullPackagePersons: 0,
  fullPackageRate: 0,

  advancePayment: 0,
  additionalPayment: 0,
};

function App() {
  const [activePage, setActivePage] =
    useState("Dashboard");

  const [showBookingForm, setShowBookingForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState(null);

  // Booking search and filters
  const [bookingSearch, setBookingSearch] =
    useState("");

  const [bookingDateFilter, setBookingDateFilter] =
    useState("");

  const [bookingPaymentFilter, setBookingPaymentFilter] =
    useState("All");

  /*
   * FIRESTORE DATA
   *
   * Bookings, services and siders are now stored in Firebase Firestore.
   * This makes the app sync between desktop, mobile and the Vercel site.
   */
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState(defaultServices);
  const [siders, setSiders] = useState(defaultSiders);

  const bookingsSeededRef = useRef(false);
  const servicesSeededRef = useRef(false);
  const sidersSeededRef = useRef(false);

  useEffect(() => {
    const unsubBookings = onSnapshot(
      collection(db, BOOKINGS_COLLECTION),
      async (snapshot) => {
        const cloudBookings = snapshot.docs.map((item) => ({
          ...item.data(),
          id: item.id,
        }));

        if (cloudBookings.length === 0 && !bookingsSeededRef.current) {
          bookingsSeededRef.current = true;
          try {
            const saved = localStorage.getItem("latishaBookings");
            const localBookings = saved ? JSON.parse(saved) : [];
            if (Array.isArray(localBookings) && localBookings.length > 0) {
              await Promise.all(
                localBookings.map((item) =>
                  setDoc(
                    doc(db, BOOKINGS_COLLECTION, String(item.id || Date.now())),
                    item
                  )
                )
              );
              return;
            }
          } catch (error) {
            console.error("Could not migrate local bookings:", error);
          }
        }

        setBookings(cloudBookings);
      },
      (error) => console.error("Firestore bookings listener error:", error)
    );

    const unsubServices = onSnapshot(
      collection(db, SERVICES_COLLECTION),
      async (snapshot) => {
        const cloudServices = snapshot.docs.map((item) => ({
          ...item.data(),
          id: item.id,
        }));

        if (cloudServices.length === 0 && !servicesSeededRef.current) {
          servicesSeededRef.current = true;
          try {
            const saved = localStorage.getItem("latishaServices");
            const localServices = saved ? JSON.parse(saved) : defaultServices;
            const source = Array.isArray(localServices) ? localServices : defaultServices;
            await Promise.all(
              source.map((item) =>
                setDoc(doc(db, SERVICES_COLLECTION, String(item.id)), item)
              )
            );
            return;
          } catch (error) {
            console.error("Could not seed services:", error);
          }
        }

        setServices(cloudServices.length ? cloudServices : defaultServices);
      },
      (error) => console.error("Firestore services listener error:", error)
    );

    const unsubSiders = onSnapshot(
      collection(db, SIDERS_COLLECTION),
      async (snapshot) => {
        const cloudSiders = snapshot.docs.map((item) => ({
          ...item.data(),
          id: item.id,
        }));

        if (cloudSiders.length === 0 && !sidersSeededRef.current) {
          sidersSeededRef.current = true;
          try {
            const saved = localStorage.getItem("latishaSiders");
            const localSiders = saved ? JSON.parse(saved) : defaultSiders;
            const source = Array.isArray(localSiders) ? localSiders : defaultSiders;
            await Promise.all(
              source.map((item) =>
                setDoc(doc(db, SIDERS_COLLECTION, String(item.id)), item)
              )
            );
            return;
          } catch (error) {
            console.error("Could not seed siders:", error);
          }
        }

        setSiders(cloudSiders.length ? cloudSiders : defaultSiders);
      },
      (error) => console.error("Firestore siders listener error:", error)
    );

    return () => {
      unsubBookings();
      unsubServices();
      unsubSiders();
    };
  }, []);

  /*
   * BOOKING FORM
   */
  const [booking, setBooking] =
    useState({
      ...emptyBooking,
    });

  /*
   * SERVICE FORM
   */
  const [serviceForm, setServiceForm] =
    useState({
      name: "",
      category: "Bridal",
      rate: "",
    });

  const [editingServiceId, setEditingServiceId] =
    useState(null);

  /*
   * SIDER FORM
   */
  const [siderForm, setSiderForm] =
    useState({
      name: "",
      rate: "",
    });

  const [editingSiderId, setEditingSiderId] =
    useState(null);

  /*
   * SAVE BOOKINGS
   */
  useEffect(() => {
    try {
      localStorage.setItem(
        BOOKING_STORAGE_KEY,
        JSON.stringify(bookings)
      );
    } catch (error) {
      console.error(
        "Could not save bookings:",
        error
      );
    }
  }, [bookings]);

  /*
   * SAVE SERVICES
   */
  useEffect(() => {
    try {
      localStorage.setItem(
        SERVICE_STORAGE_KEY,
        JSON.stringify(services)
      );
    } catch (error) {
      console.error(
        "Could not save services:",
        error
      );
    }
  }, [services]);

  /*
   * SAVE SIDERS
   */
  useEffect(() => {
    try {
      localStorage.setItem(
        SIDER_STORAGE_KEY,
        JSON.stringify(siders)
      );
    } catch (error) {
      console.error(
        "Could not save siders:",
        error
      );
    }
  }, [siders]);

  /*
   * FIND SIDER RATE
   */
  const getSiderRate = (
    siderName
  ) => {
    const found =
      siders.find(
        (item) =>
          item.name ===
          siderName
      );

    return found
      ? Number(found.rate)
      : 0;
  };

  /*
   * RESET BOOKING
   *
   * New bookings receive the
   * CURRENT Sider Master rates.
   */
  const resetBooking = () => {
    setBooking({
      ...emptyBooking,

      makeupOnlyRate:
        getSiderRate(
          "Makeup Only"
        ),

      hairStylingRate:
        getSiderRate(
          "Hair Styling Only"
        ),

      sareeDrapingRate:
        getSiderRate(
          "Saree Draping Only"
        ),

      makeupHairRate:
        getSiderRate(
          "Makeup + Hair"
        ),

      makeupSareeRate:
        getSiderRate(
          "Makeup + Saree Draping"
        ),

      fullPackageRate:
        getSiderRate(
          "Full Package"
        ),
    });

    setEditingId(null);
  };

  /*
   * UPDATE BOOKING FIELD
   */
  const updateBooking = (
    field,
    value
  ) => {
    setBooking(
      (previous) => ({
        ...previous,
        [field]: value,
      })
    );
  };

  /*
   * SIDER TOTAL
   */
  const getSidersTotal = () => {
    return (
      Number(
        booking.makeupOnlyPersons ||
          0
      ) *
        Number(
          booking.makeupOnlyRate ||
            0
        ) +

      Number(
        booking.hairStylingPersons ||
          0
      ) *
        Number(
          booking.hairStylingRate ||
            0
        ) +

      Number(
        booking.sareeDrapingPersons ||
          0
      ) *
        Number(
          booking.sareeDrapingRate ||
            0
        ) +

      Number(
        booking.makeupHairPersons ||
          0
      ) *
        Number(
          booking.makeupHairRate ||
            0
        ) +

      Number(
        booking.makeupSareePersons ||
          0
      ) *
        Number(
          booking.makeupSareeRate ||
            0
        ) +

      Number(
        booking.fullPackagePersons ||
          0
      ) *
        Number(
          booking.fullPackageRate ||
            0
        )
    );
  };

  /*
   * GRAND TOTAL
   */
  const getGrandTotal = () => {
    return (
      Number(
        booking.amount || 0
      ) +
      getSidersTotal()
    );
  };

  /*
   * TOTAL PAID
   */
  const getTotalPaid = () => {
    return (
      Number(
        booking.advancePayment ||
          0
      ) +
      Number(
        booking.additionalPayment ||
          0
      )
    );
  };

  /*
   * PENDING
   */
  const getPendingAmount = () => {
    return Math.max(
      getGrandTotal() -
        getTotalPaid(),
      0
    );
  };

  /*
   * PAYMENT STATUS
   */
  const getPaymentStatus = (
    total,
    paid
  ) => {
    if (
      Number(total) > 0 &&
      Number(paid) >=
        Number(total)
    ) {
      return "Paid";
    }

    if (Number(paid) > 0) {
      return "Partial";
    }

    return "Pending";
  };

  /*
   * SAVE BOOKING
   */
  const saveBooking = async () => {
    if (!booking.brideName.trim()) {
      alert("Please enter Bride / Client Name");
      return;
    }

    if (!booking.mobile.trim()) {
      alert("Please enter Mobile Number");
      return;
    }

    const grandTotal = getGrandTotal();
    const totalPaid = getTotalPaid();
    const pendingAmount = Math.max(grandTotal - totalPaid, 0);
    const paymentStatus = getPaymentStatus(grandTotal, totalPaid);

    const bookingData = {
      ...booking,
      amount: Number(booking.amount || 0),
      makeupOnlyPersons: Number(booking.makeupOnlyPersons || 0),
      makeupOnlyRate: Number(booking.makeupOnlyRate || 0),
      hairStylingPersons: Number(booking.hairStylingPersons || 0),
      hairStylingRate: Number(booking.hairStylingRate || 0),
      sareeDrapingPersons: Number(booking.sareeDrapingPersons || 0),
      sareeDrapingRate: Number(booking.sareeDrapingRate || 0),
      makeupHairPersons: Number(booking.makeupHairPersons || 0),
      makeupHairRate: Number(booking.makeupHairRate || 0),
      makeupSareePersons: Number(booking.makeupSareePersons || 0),
      makeupSareeRate: Number(booking.makeupSareeRate || 0),
      fullPackagePersons: Number(booking.fullPackagePersons || 0),
      fullPackageRate: Number(booking.fullPackageRate || 0),
      advancePayment: Number(booking.advancePayment || 0),
      additionalPayment: Number(booking.additionalPayment || 0),
      sidersTotal: getSidersTotal(),
      grandTotal,
      totalPaid,
      pendingAmount,
      paymentStatus,
      updatedAt: new Date().toISOString(),
    };

    try {
      const id = editingId !== null ? String(editingId) : Date.now().toString();
      const newBooking = {
        ...bookingData,
        id,
        ...(editingId === null ? { createdAt: new Date().toISOString() } : {}),
      };

      await setDoc(
        doc(db, BOOKINGS_COLLECTION, id),
        newBooking,
        { merge: true }
      );

      alert(editingId !== null ? "Booking updated successfully!" : "Booking saved successfully!");
      resetBooking();
      setShowBookingForm(false);
      setActivePage("Bookings");
    } catch (error) {
      console.error("Could not save booking:", error);
      alert("Could not save booking to Firebase. Please check your internet connection and Firebase setup.");
    }
  };

  /*
   * EDIT BOOKING
   */
  const editBooking = (
    item
  ) => {
    setBooking({
      ...emptyBooking,
      ...item,

      amount: Number(
        item.amount || 0
      ),

      makeupOnlyPersons:
        Number(
          item.makeupOnlyPersons ||
            0
        ),

      makeupOnlyRate:
        Number(
          item.makeupOnlyRate ||
            0
        ),

      hairStylingPersons:
        Number(
          item.hairStylingPersons ||
            0
        ),

      hairStylingRate:
        Number(
          item.hairStylingRate ||
            0
        ),

      sareeDrapingPersons:
        Number(
          item.sareeDrapingPersons ||
            0
        ),

      sareeDrapingRate:
        Number(
          item.sareeDrapingRate ||
            0
        ),

      makeupHairPersons:
        Number(
          item.makeupHairPersons ||
            0
        ),

      makeupHairRate:
        Number(
          item.makeupHairRate ||
            0
        ),

      makeupSareePersons:
        Number(
          item.makeupSareePersons ||
            0
        ),

      makeupSareeRate:
        Number(
          item.makeupSareeRate ||
            0
        ),

      fullPackagePersons:
        Number(
          item.fullPackagePersons ||
            0
        ),

      fullPackageRate:
        Number(
          item.fullPackageRate ||
            0
        ),

      advancePayment:
        Number(
          item.advancePayment ||
            0
        ),

      additionalPayment:
        Number(
          item.additionalPayment ||
            0
        ),
    });

    setEditingId(
      item.id
    );

    setActivePage(
      "Bookings"
    );

    setShowBookingForm(
      true
    );
  };

  /*
   * DELETE BOOKING
   */
  const deleteBooking = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this booking?"
    );

    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, BOOKINGS_COLLECTION, String(id)));
    } catch (error) {
      console.error("Could not delete booking:", error);
      alert("Could not delete booking from Firebase.");
    }
  };

  /*
   * SERVICE MASTER
   */
  const updateServiceForm = (
    field,
    value
  ) => {
    setServiceForm(
      (previous) => ({
        ...previous,
        [field]: value,
      })
    );
  };

  const resetServiceForm = () => {
    setServiceForm({
      name: "",
      category: "Bridal",
      rate: "",
    });

    setEditingServiceId(
      null
    );
  };

  const saveService = async () => {
    if (!serviceForm.name.trim()) {
      alert("Please enter service name");
      return;
    }

    if (serviceForm.rate === "" || Number(serviceForm.rate) < 0) {
      alert("Please enter a valid rate");
      return;
    }

    const serviceData = {
      name: serviceForm.name.trim(),
      category: serviceForm.category,
      rate: Number(serviceForm.rate),
    };

    try {
      const id = editingServiceId !== null
        ? String(editingServiceId)
        : "service-" + Date.now();

      await setDoc(
        doc(db, SERVICES_COLLECTION, id),
        { id, ...serviceData },
        { merge: true }
      );

      alert(editingServiceId !== null ? "Service updated successfully!" : "Service added successfully!");
      resetServiceForm();
    } catch (error) {
      console.error("Could not save service:", error);
      alert("Could not save service to Firebase.");
    }
  };

  const editService = (
    item
  ) => {
    setServiceForm({
      name: item.name,
      category:
        item.category ||
        "Bridal",
      rate: item.rate,
    });

    setEditingServiceId(
      item.id
    );
  };

  const deleteService = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this service?"
    );

    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, SERVICES_COLLECTION, String(id)));
    } catch (error) {
      console.error("Could not delete service:", error);
      alert("Could not delete service from Firebase.");
    }
  };

  /*
   * SELECT MAIN SERVICE
   */
  const selectMainService = (
    serviceName
  ) => {
    const selected =
      services.find(
        (item) =>
          item.name ===
          serviceName
      );

    if (!selected) {
      updateBooking(
        "service",
        serviceName
      );

      return;
    }

    setBooking(
      (previous) => ({
        ...previous,

        service:
          selected.name,

        amount:
          Number(
            selected.rate
          ),
      })
    );
  };

  /*
   * SIDER MASTER
   */
  const updateSiderForm = (
    field,
    value
  ) => {
    setSiderForm(
      (previous) => ({
        ...previous,
        [field]: value,
      })
    );
  };

  const resetSiderForm = () => {
    setSiderForm({
      name: "",
      rate: "",
    });

    setEditingSiderId(
      null
    );
  };

  const saveSider = async () => {
    if (!siderForm.name.trim()) {
      alert("Please enter sider service name");
      return;
    }

    if (siderForm.rate === "" || Number(siderForm.rate) < 0) {
      alert("Please enter a valid rate");
      return;
    }

    const siderData = {
      name: siderForm.name.trim(),
      rate: Number(siderForm.rate),
    };

    try {
      const id = editingSiderId !== null
        ? String(editingSiderId)
        : "sider-" + Date.now();

      await setDoc(
        doc(db, SIDERS_COLLECTION, id),
        { id, ...siderData },
        { merge: true }
      );

      alert(editingSiderId !== null ? "Sider updated successfully!" : "Sider added successfully!");
      resetSiderForm();
    } catch (error) {
      console.error("Could not save sider:", error);
      alert("Could not save sider to Firebase.");
    }
  };

  const editSider = (
    item
  ) => {
    setSiderForm({
      name: item.name,
      rate: item.rate,
    });

    setEditingSiderId(
      item.id
    );
  };

  const deleteSider = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this sider?"
    );

    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, SIDERS_COLLECTION, String(id)));
    } catch (error) {
      console.error("Could not delete sider:", error);
      alert("Could not delete sider from Firebase.");
    }
  };

  /*
   * DASHBOARD
   */
  const renderDashboard =
    () => {
      const totalRevenue =
        bookings.reduce(
          (total, item) =>
            total +
            Number(
              item.grandTotal ||
                0
            ),
          0
        );

      const totalReceived =
        bookings.reduce(
          (total, item) => {
            const paid =
              item.totalPaid !==
              undefined
                ? Number(
                    item.totalPaid
                  )
                : Number(
                    item.advancePayment ||
                      0
                  ) +
                  Number(
                    item.additionalPayment ||
                      0
                  );

            return total + paid;
          },
          0
        );

      const totalPending =
        Math.max(
          totalRevenue -
            totalReceived,
          0
        );

      return (
        <>
          <div className="header">
            <div>
              <h1>
                Dashboard
              </h1>

              <p>
                Welcome to Latisha
                Beauty Hub Admin
                Panel
              </p>
            </div>

            <div className="admin-profile">
              <div className="admin-avatar">
                LB
              </div>

              <div>
                <strong>
                  Admin
                </strong>

                <p>
                  Latisha Beauty
                  Hub
                </p>
              </div>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                📅
              </div>

              <div>
                <p>
                  Total Bookings
                </p>

                <h2>
                  {
                    bookings.length
                  }
                </h2>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                💰
              </div>

              <div>
                <p>
                  Total Booking
                  Value
                </p>

                <h2>
                  ₹
                  {totalRevenue.toLocaleString(
                    "en-IN"
                  )}
                </h2>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                ✅
              </div>

              <div>
                <p>
                  Total Received
                </p>

                <h2>
                  ₹
                  {totalReceived.toLocaleString(
                    "en-IN"
                  )}
                </h2>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                ⏳
              </div>

              <div>
                <p>
                  Total Pending
                </p>

                <h2>
                  ₹
                  {totalPending.toLocaleString(
                    "en-IN"
                  )}
                </h2>
              </div>
            </div>
          </div>

          <div className="dashboard-grid">
            <div className="panel">
              <div className="panel-header">
                <h2>
                  Recent Bookings
                </h2>

                <button
                  onClick={() =>
                    setActivePage(
                      "Bookings"
                    )
                  }
                >
                  View All
                </button>
              </div>

              {bookings.length > 0 && (
                <div className="booking-filters">
                  <div className="form-group">
                    <label>
                      Search Client / Mobile
                    </label>

                    <input
                      type="text"
                      value={bookingSearch}
                      onChange={(e) =>
                        setBookingSearch(e.target.value)
                      }
                      placeholder="Search by name or mobile..."
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Event Date
                    </label>

                    <input
                      type="date"
                      value={bookingDateFilter}
                      onChange={(e) =>
                        setBookingDateFilter(e.target.value)
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Payment Status
                    </label>

                    <select
                      value={bookingPaymentFilter}
                      onChange={(e) =>
                        setBookingPaymentFilter(e.target.value)
                      }
                    >
                      <option value="All">
                        All Statuses
                      </option>
                      <option value="Paid">
                        Paid
                      </option>
                      <option value="Partial">
                        Partial
                      </option>
                      <option value="Pending">
                        Pending
                      </option>
                    </select>
                  </div>

                  <button
                    className="secondary-button filter-reset-button"
                    onClick={() => {
                      setBookingSearch("");
                      setBookingDateFilter("");
                      setBookingPaymentFilter("All");
                    }}
                  >
                    Clear Filters
                  </button>
                </div>
              )}

              {bookings.length ===
              0 ? (
                <div className="empty-state">
                  <span>
                    📋
                  </span>

                  <h3>
                    No bookings yet
                  </h3>

                  <p>
                    Start adding
                    bridal bookings
                    to manage your
                    events and
                    payments.
                  </p>
                </div>
              ) : (
                <div className="booking-list">
                  {bookings
                    .slice(-5)
                    .reverse()
                    .map(
                      (
                        item
                      ) => (
                        <div
                          className="booking-row"
                          key={
                            item.id
                          }
                        >
                          <div>
                            <strong>
                              {
                                item.brideName
                              }
                            </strong>

                            <p>
                              {item.functionName ||
                                "Bridal Booking"}
                            </p>
                          </div>

                          <div>
                            <div className="booking-amount">
                              ₹
                              {Number(
                                item.grandTotal ||
                                  0
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </div>

                            <small>
                              {item.paymentStatus ||
                                "Pending"}
                            </small>
                          </div>
                        </div>
                      )
                    )}
                </div>
              )}
            </div>

            <div className="panel">
              <div className="panel-header">
                <h2>
                  Quick Actions
                </h2>
              </div>

              <div className="quick-actions">
                <button
                  onClick={() => {
                    resetBooking();

                    setActivePage(
                      "Bookings"
                    );

                    setShowBookingForm(
                      true
                    );
                  }}
                >
                  <span>
                    ➕
                  </span>

                  New Booking
                </button>

                <button
                  onClick={() =>
                    setActivePage(
                      "Bookings"
                    )
                  }
                >
                  <span>
                    📋
                  </span>

                  View Bookings
                </button>

                <button
                  onClick={() =>
                    setActivePage(
                      "Services"
                    )
                  }
                >
                  <span>
                    💄
                  </span>

                  Services
                </button>

                <button
                  onClick={() =>
                    setActivePage(
                      "Siders"
                    )
                  }
                >
                  <span>
                    👩‍🦰
                  </span>

                  Siders Master
                </button>

                <button
                  onClick={() =>
                    setActivePage(
                      "Payments"
                    )
                  }
                >
                  <span>
                    💰
                  </span>

                  Payments
                </button>
              </div>
            </div>
          </div>
        </>
      );
    };

  /*
   * BOOKINGS PAGE
   */
  const renderBookings =
    () => {
      const siderRows = [
        [
          "Makeup Only",
          "makeupOnlyPersons",
          "makeupOnlyRate",
        ],
        [
          "Hair Styling Only",
          "hairStylingPersons",
          "hairStylingRate",
        ],
        [
          "Saree Draping Only",
          "sareeDrapingPersons",
          "sareeDrapingRate",
        ],
        [
          "Makeup + Hair",
          "makeupHairPersons",
          "makeupHairRate",
        ],
        [
          "Makeup + Saree Draping",
          "makeupSareePersons",
          "makeupSareeRate",
        ],
        [
          "Full Package",
          "fullPackagePersons",
          "fullPackageRate",
        ],
      ];

      const filteredBookings = bookings
        .filter((item) => {
          const search = bookingSearch
            .trim()
            .toLowerCase();

          if (!search) {
            return true;
          }

          return (
            String(item.brideName || "")
              .toLowerCase()
              .includes(search) ||
            String(item.mobile || "")
              .toLowerCase()
              .includes(search)
          );
        })
        .filter((item) => {
          if (!bookingDateFilter) {
            return true;
          }

          return item.eventDate === bookingDateFilter;
        })
        .filter((item) => {
          if (bookingPaymentFilter === "All") {
            return true;
          }

          const total = Number(item.grandTotal || 0);

          const paid =
            item.totalPaid !== undefined
              ? Number(item.totalPaid)
              : Number(item.advancePayment || 0) +
                Number(item.additionalPayment || 0);

          const status =
            item.paymentStatus ||
            getPaymentStatus(total, paid);

          return status === bookingPaymentFilter;
        })
        .sort((a, b) => {
          const dateA = String(a.eventDate || "9999-12-31");
          const dateB = String(b.eventDate || "9999-12-31");

          if (dateA !== dateB) {
            return dateA.localeCompare(dateB);
          }

          return String(a.brideName || "")
            .localeCompare(
              String(b.brideName || "")
            );
        });

      return (
        <>
          <div className="page-header">
            <div>
              <h1>
                Bookings
              </h1>

              <p>
                Manage all bridal
                and beauty
                bookings
              </p>
            </div>

            <button
              className="primary-button"
              onClick={() => {
                resetBooking();

                setShowBookingForm(
                  true
                );
              }}
            >
              ➕ Add New Booking
            </button>
          </div>

          {showBookingForm && (
            <div className="booking-form-container">
              <div className="form-header">
                <div>
                  <h2>
                    {editingId !==
                    null
                      ? "Edit Booking"
                      : "New Booking"}
                  </h2>

                  <p>
                    Enter client,
                    event, service
                    and payment
                    details
                  </p>
                </div>

                <button
                  className="close-button"
                  onClick={() => {
                    resetBooking();

                    setShowBookingForm(
                      false
                    );
                  }}
                >
                  ✕
                </button>
              </div>

              <div className="form-section">
                <h3>
                  Client Details
                </h3>

                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      Bride / Client
                      Name *
                    </label>

                    <input
                      type="text"
                      value={
                        booking.brideName
                      }
                      onChange={(
                        e
                      ) =>
                        updateBooking(
                          "brideName",
                          e.target
                            .value
                        )
                      }
                      placeholder="Enter client name"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Mobile Number *
                    </label>

                    <input
                      type="tel"
                      value={
                        booking.mobile
                      }
                      onChange={(
                        e
                      ) =>
                        updateBooking(
                          "mobile",
                          e.target
                            .value
                        )
                      }
                      placeholder="Enter mobile number"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>
                  Event Details
                </h3>

                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      Function Name
                    </label>

                    <input
                      type="text"
                      value={
                        booking.functionName
                      }
                      onChange={(
                        e
                      ) =>
                        updateBooking(
                          "functionName",
                          e.target
                            .value
                        )
                      }
                      placeholder="Wedding / Reception / Haldi"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Event Date
                    </label>

                    <input
                      type="date"
                      value={
                        booking.eventDate
                      }
                      onChange={(
                        e
                      ) =>
                        updateBooking(
                          "eventDate",
                          e.target
                            .value
                        )
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Venue
                    </label>

                    <input
                      type="text"
                      value={
                        booking.venue
                      }
                      onChange={(
                        e
                      ) =>
                        updateBooking(
                          "venue",
                          e.target
                            .value
                        )
                      }
                      placeholder="Enter venue"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>
                  Main Makeup Service
                </h3>

                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      Select Service
                    </label>

                    <select
                      value={
                        booking.service
                      }
                      onChange={(
                        e
                      ) =>
                        selectMainService(
                          e.target
                            .value
                        )
                      }
                    >
                      <option value="">
                        Select Service
                      </option>

                      {services.map(
                        (
                          item
                        ) => (
                          <option
                            key={
                              item.id
                            }
                            value={
                              item.name
                            }
                          >
                            {
                              item.name
                            }{" "}
                            — ₹
                            {Number(
                              item.rate
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>
                      Amount (₹)
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={
                        booking.amount
                      }
                      onChange={(
                        e
                      ) =>
                        updateBooking(
                          "amount",
                          e.target
                            .value
                        )
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>
                  Siders Booking
                </h3>

                <div className="siders-table">
                  <div className="siders-row siders-heading">
                    <div>
                      Service
                    </div>

                    <div>
                      Persons
                    </div>

                    <div>
                      Rate Per Person
                    </div>

                    <div>
                      Total
                    </div>
                  </div>

                  {siderRows.map(
                    ([
                      name,
                      personsField,
                      rateField,
                    ]) => (
                      <div
                        className="siders-row"
                        key={
                          personsField
                        }
                      >
                        <div>
                          {name}
                        </div>

                        <input
                          type="number"
                          min="0"
                          value={
                            booking[
                              personsField
                            ]
                          }
                          onChange={(
                            e
                          ) =>
                            updateBooking(
                              personsField,
                              e.target
                                .value
                            )
                          }
                        />

                        <input
                          type="number"
                          min="0"
                          value={
                            booking[
                              rateField
                            ]
                          }
                          onChange={(
                            e
                          ) =>
                            updateBooking(
                              rateField,
                              e.target
                                .value
                            )
                          }
                        />

                        <strong>
                          ₹
                          {(
                            Number(
                              booking[
                                personsField
                              ] || 0
                            ) *
                            Number(
                              booking[
                                rateField
                              ] || 0
                            )
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </strong>
                      </div>
                    )
                  )}
                </div>

                <div className="total-box">
                  <div>
                    <span>
                      Main Service
                      Total
                    </span>

                    <strong>
                      ₹
                      {Number(
                        booking.amount ||
                          0
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Siders Total
                    </span>

                    <strong>
                      ₹
                      {getSidersTotal().toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                  </div>

                  <div className="grand-total">
                    <span>
                      Grand Total
                    </span>

                    <strong>
                      ₹
                      {getGrandTotal().toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>
                  Payment Details
                </h3>

                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      Advance Received
                      (₹)
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={
                        booking.advancePayment
                      }
                      onChange={(
                        e
                      ) =>
                        updateBooking(
                          "advancePayment",
                          e.target
                            .value
                        )
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Additional Payment
                      (₹)
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={
                        booking.additionalPayment
                      }
                      onChange={(
                        e
                      ) =>
                        updateBooking(
                          "additionalPayment",
                          e.target
                            .value
                        )
                      }
                    />
                  </div>
                </div>

                <div className="total-box">
                  <div>
                    <span>
                      Booking Total
                    </span>

                    <strong>
                      ₹
                      {getGrandTotal().toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Total Paid
                    </span>

                    <strong>
                      ₹
                      {getTotalPaid().toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                  </div>

                  <div className="grand-total">
                    <span>
                      Pending Balance
                    </span>

                    <strong>
                      ₹
                      {getPendingAmount().toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button
                  className="secondary-button"
                  onClick={() => {
                    resetBooking();

                    setShowBookingForm(
                      false
                    );
                  }}
                >
                  Cancel
                </button>

                <button
                  className="primary-button"
                  onClick={
                    saveBooking
                  }
                >
                  💾{" "}
                  {editingId !==
                  null
                    ? "Update Booking"
                    : "Save Booking"}
                </button>
              </div>
            </div>
          )}

          {!showBookingForm && (
            <div className="panel bookings-panel">
              <div className="panel-header">
                <h2>
                  All Bookings
                </h2>

                <span>
                  Showing {filteredBookings.length} of{" "}
                  {bookings.length} Booking(s)
                </span>
              </div>

              {bookings.length ===
              0 ? (
                <div className="empty-state">
                  <span>
                    👰
                  </span>

                  <h2>
                    No bookings found
                  </h2>

                  <p>
                    Click "Add New
                    Booking" to
                    create your
                    first booking.
                  </p>
                </div>
              ) : (
                <div className="booking-list">
                  {filteredBookings.map(
                    (
                      item
                    ) => {
                      const total =
                        Number(
                          item.grandTotal ||
                            0
                        );

                      const paid =
                        item.totalPaid !==
                        undefined
                          ? Number(
                              item.totalPaid
                            )
                          : Number(
                              item.advancePayment ||
                                0
                            ) +
                            Number(
                              item.additionalPayment ||
                                0
                            );

                      const pending =
                        Math.max(
                          total -
                            paid,
                          0
                        );

                      const status =
                        item.paymentStatus ||
                        getPaymentStatus(
                          total,
                          paid
                        );

                      return (
                        <div
                          className="booking-card"
                          key={
                            item.id
                          }
                        >
                          <div className="booking-card-info">
                            <h3>
                              {
                                item.brideName
                              }
                            </h3>

                            <p>
                              📞{" "}
                              {
                                item.mobile
                              }
                            </p>

                            <p>
                              📅{" "}
                              {item.eventDate ||
                                "Date not added"}
                            </p>

                            <p>
                              📍{" "}
                              {item.venue ||
                                "Venue not added"}
                            </p>

                            <p>
                              ✨{" "}
                              {item.functionName ||
                                "Bridal Booking"}
                            </p>

                            <p>
                              💰 Paid: ₹
                              {paid.toLocaleString(
                                "en-IN"
                              )}
                            </p>

                            <p>
                              ⏳ Pending:
                              ₹
                              {pending.toLocaleString(
                                "en-IN"
                              )}
                            </p>

                            <p>
                              Status:{" "}
                              <strong>
                                {status ===
                                "Paid"
                                  ? "🟢"
                                  : status ===
                                    "Partial"
                                  ? "🟡"
                                  : "🔴"}{" "}
                                {
                                  status
                                }
                              </strong>
                            </p>
                          </div>

                          <div className="booking-card-right">
                            <h2>
                              ₹
                              {total.toLocaleString(
                                "en-IN"
                              )}
                            </h2>

                            <button
                              className="primary-button"
                              onClick={() =>
                                editBooking(
                                  item
                                )
                              }
                            >
                              ✏️ Edit
                            </button>

                            <button
                              className="delete-button"
                              onClick={() =>
                                deleteBooking(
                                  item.id
                                )
                              }
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      );
                    }
                  )}

                  {filteredBookings.length === 0 && (
                    <div className="empty-state">
                      <span>
                        🔎
                      </span>

                      <h2>
                        No matching bookings
                      </h2>

                      <p>
                        Try changing your search or filters.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      );
    };

  /*
   * SERVICES PAGE
   */
  const renderServices =
    () => {
      return (
        <>
          <div className="page-header">
            <div>
              <h1>
                Service Master
              </h1>

              <p>
                Add and manage
                your beauty
                services and
                rates
              </p>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>
                {editingServiceId !==
                null
                  ? "Edit Service"
                  : "Add New Service"}
              </h2>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>
                  Service Name
                </label>

                <input
                  type="text"
                  value={
                    serviceForm.name
                  }
                  onChange={(e) =>
                    updateServiceForm(
                      "name",
                      e.target.value
                    )
                  }
                  placeholder="e.g. Bridal Makeup"
                />
              </div>

              <div className="form-group">
                <label>
                  Category
                </label>

                <select
                  value={
                    serviceForm.category
                  }
                  onChange={(e) =>
                    updateServiceForm(
                      "category",
                      e.target.value
                    )
                  }
                >
                  <option value="Bridal">
                    Bridal
                  </option>

                  <option value="Siders">
                    Siders
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  Rate (₹)
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    serviceForm.rate
                  }
                  onChange={(e) =>
                    updateServiceForm(
                      "rate",
                      e.target.value
                    )
                  }
                  placeholder="Enter rate"
                />
              </div>
            </div>

            <div className="form-actions">
              {editingServiceId !==
                null && (
                <button
                  className="secondary-button"
                  onClick={
                    resetServiceForm
                  }
                >
                  Cancel
                </button>
              )}

              <button
                className="primary-button"
                onClick={
                  saveService
                }
              >
                {editingServiceId !==
                null
                  ? "💾 Update Service"
                  : "➕ Add Service"}
              </button>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>
                Your Services
              </h2>

              <span>
                {services.length}{" "}
                Service(s)
              </span>
            </div>

            <div className="booking-list">
              {services.map(
                (item) => (
                  <div
                    className="booking-card"
                    key={
                      item.id
                    }
                  >
                    <div className="booking-card-info">
                      <h3>
                        {
                          item.name
                        }
                      </h3>

                      <p>
                        Category:{" "}
                        {
                          item.category
                        }
                      </p>

                      <p>
                        Rate: ₹
                        {Number(
                          item.rate
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </p>
                    </div>

                    <div className="booking-card-right">
                      <h2>
                        ₹
                        {Number(
                          item.rate
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </h2>

                      <button
                        className="primary-button"
                        onClick={() =>
                          editService(
                            item
                          )
                        }
                      >
                        ✏️ Edit
                      </button>

                      <button
                        className="delete-button"
                        onClick={() =>
                          deleteService(
                            item.id
                          )
                        }
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </>
      );
    };

  /*
   * SIDERS MASTER PAGE
   */
  const renderSiders =
    () => {
      return (
        <>
          <div className="page-header">
            <div>
              <h1>
                Siders Master
              </h1>

              <p>
                Manage sider
                services and
                rates
              </p>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>
                {editingSiderId !==
                null
                  ? "Edit Sider"
                  : "Add New Sider"}
              </h2>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>
                  Sider Service Name
                </label>

                <input
                  type="text"
                  value={
                    siderForm.name
                  }
                  onChange={(e) =>
                    updateSiderForm(
                      "name",
                      e.target.value
                    )
                  }
                  placeholder="e.g. Makeup Only"
                />
              </div>

              <div className="form-group">
                <label>
                  Rate Per Person (₹)
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    siderForm.rate
                  }
                  onChange={(e) =>
                    updateSiderForm(
                      "rate",
                      e.target.value
                    )
                  }
                  placeholder="Enter rate"
                />
              </div>
            </div>

            <div className="form-actions">
              {editingSiderId !==
                null && (
                <button
                  className="secondary-button"
                  onClick={
                    resetSiderForm
                  }
                >
                  Cancel
                </button>
              )}

              <button
                className="primary-button"
                onClick={
                  saveSider
                }
              >
                {editingSiderId !==
                null
                  ? "💾 Update Sider"
                  : "➕ Add Sider"}
              </button>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>
                Your Sider Services
              </h2>

              <span>
                {siders.length}{" "}
                Sider(s)
              </span>
            </div>

            {siders.length ===
            0 ? (
              <div className="empty-state">
                <span>
                  👩‍🦰
                </span>

                <h2>
                  No siders found
                </h2>

                <p>
                  Add your first
                  sider service
                  above.
                </p>
              </div>
            ) : (
              <div className="booking-list">
                {siders.map(
                  (item) => (
                    <div
                      className="booking-card"
                      key={
                        item.id
                      }
                    >
                      <div className="booking-card-info">
                        <h3>
                          {
                            item.name
                          }
                        </h3>

                        <p>
                          Rate per
                          person:
                        </p>

                        <h3>
                          ₹
                          {Number(
                            item.rate
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </h3>
                      </div>

                      <div className="booking-card-right">
                        <h2>
                          ₹
                          {Number(
                            item.rate
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </h2>

                        <button
                          className="primary-button"
                          onClick={() =>
                            editSider(
                              item
                            )
                          }
                        >
                          ✏️ Edit
                        </button>

                        <button
                          className="delete-button"
                          onClick={() =>
                            deleteSider(
                              item.id
                            )
                          }
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </>
      );
    };

  /*
   * PAYMENTS PAGE
   */
  const renderPayments =
    () => {
      const totalValue =
        bookings.reduce(
          (total, item) =>
            total +
            Number(
              item.grandTotal ||
                0
            ),
          0
        );

      const totalReceived =
        bookings.reduce(
          (total, item) => {
            const paid =
              item.totalPaid !==
              undefined
                ? Number(
                    item.totalPaid
                  )
                : Number(
                    item.advancePayment ||
                      0
                  ) +
                  Number(
                    item.additionalPayment ||
                      0
                  );

            return total + paid;
          },
          0
        );

      const totalPending =
        Math.max(
          totalValue -
            totalReceived,
          0
        );

      return (
        <>
          <div className="page-header">
            <div>
              <h1>
                Payments
              </h1>

              <p>
                Track received
                and pending
                payments
              </p>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                💰
              </div>

              <div>
                <p>
                  Total Booking
                  Value
                </p>

                <h2>
                  ₹
                  {totalValue.toLocaleString(
                    "en-IN"
                  )}
                </h2>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                ✅
              </div>

              <div>
                <p>
                  Total Received
                </p>

                <h2>
                  ₹
                  {totalReceived.toLocaleString(
                    "en-IN"
                  )}
                </h2>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                ⏳
              </div>

              <div>
                <p>
                  Total Pending
                </p>

                <h2>
                  ₹
                  {totalPending.toLocaleString(
                    "en-IN"
                  )}
                </h2>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>
                Payment Status
              </h2>
            </div>

            {bookings.length ===
            0 ? (
              <div className="empty-state">
                <span>
                  💰
                </span>

                <h2>
                  No payments yet
                </h2>

                <p>
                  Payment
                  information
                  will appear
                  here after you
                  create
                  bookings.
                </p>
              </div>
            ) : (
              <div className="booking-list">
                {bookings.map(
                  (item) => {
                    const total =
                      Number(
                        item.grandTotal ||
                          0
                      );

                    const paid =
                      item.totalPaid !==
                      undefined
                        ? Number(
                            item.totalPaid
                          )
                        : Number(
                            item.advancePayment ||
                              0
                          ) +
                          Number(
                            item.additionalPayment ||
                              0
                          );

                    const pending =
                      Math.max(
                        total -
                          paid,
                        0
                      );

                    return (
                      <div
                        className="booking-row"
                        key={
                          item.id
                        }
                      >
                        <div>
                          <strong>
                            {
                              item.brideName
                            }
                          </strong>

                          <p>
                            {item.functionName ||
                              "Bridal Booking"}
                          </p>
                        </div>

                        <div>
                          <p>
                            Total: ₹
                            {total.toLocaleString(
                              "en-IN"
                            )}
                          </p>

                          <p>
                            Paid: ₹
                            {paid.toLocaleString(
                              "en-IN"
                            )}
                          </p>

                          <p>
                            Pending: ₹
                            {pending.toLocaleString(
                              "en-IN"
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </>
      );
    };

  /*
   * SIMPLE PAGE
   */
  const renderSimplePage = (
    title,
    description,
    icon
  ) => (
    <>
      <div className="page-header">
        <div>
          <h1>
            {title}
          </h1>

          <p>
            {description}
          </p>
        </div>
      </div>

      <div className="panel page-panel">
        <div className="empty-state">
          <span>
            {icon}
          </span>

          <h2>
            {title}
          </h2>

          <p>
            This section will be
            connected with your
            Latisha Beauty Hub
            management system.
          </p>
        </div>
      </div>
    </>
  );

  /*
   * PAGE ROUTER
   */
  const renderPage = () => {
    switch (
      activePage
    ) {
      case "Bookings":
        return renderBookings();

      case "Services":
        return renderServices();

      case "Siders":
        return renderSiders();

      case "Payments":
        return renderPayments();

      case "Clients":
        return renderSimplePage(
          "Clients",
          "Manage your client database",
          "👩"
        );

      default:
        return renderDashboard();
    }
  };

  /*
   * MAIN LAYOUT
   */
  return (
    <div className="app">

      <aside className="sidebar">

        <div className="logo">
          <div className="logo-icon">
            💄
          </div>

          <div>
            <h2>
              Latisha
            </h2>

            <p>
              Beauty Hub
              Admin
            </p>
          </div>
        </div>

        <div className="menu">

          {[
            [
              "Dashboard",
              "🏠",
            ],
            [
              "Bookings",
              "📅",
            ],
            [
              "Clients",
              "👩",
            ],
            [
              "Services",
              "💄",
            ],
            [
              "Siders",
              "👩‍🦰",
            ],
            [
              "Payments",
              "💰",
            ],
          ].map(
            ([page, icon]) => (
              <button
                key={page}
                className={`menu-item ${
                  activePage ===
                  page
                    ? "active"
                    : ""
                }`}
                onClick={() => {
                  setActivePage(
                    page
                  );

                  setShowBookingForm(
                    false
                  );

                  setEditingId(
                    null
                  );
                }}
              >
                <span>
                  {icon}
                </span>

                {page ===
                "Siders"
                  ? "Siders Master"
                  : page}
              </button>
            )
          )}

        </div>

        <div className="sidebar-bottom">
          <p>
            Latisha Beauty Hub
          </p>

          <span>
            Admin Panel v1.0
          </span>
        </div>

      </aside>

      <main className="main-content">
        {renderPage()}
      </main>

    </div>
  );
}

export default App;
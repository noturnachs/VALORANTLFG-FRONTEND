import React, { useState, useEffect } from "react";
import axios from "axios";
import moment from "moment-timezone";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

const PartyFinder = () => {
  const [parties, setParties] = useState([]);
  const [partyCode, setPartyCode] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);

  useEffect(() => {
    const fetchParties = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/parties`
        );
        const sortedParties = Array.isArray(response.data)
          ? response.data.sort(
              (a, b) => new Date(b.created_at) - new Date(a.created_at)
            )
          : [];
        setParties(sortedParties);
        setError(""); // Reset error state in case of successful fetch
      } catch (err) {
        const message = err.response?.data?.msg || "An error occurred";
        setError(message);
      }
    };

    fetchParties();

    socket.on("partyExpired", (id) => {
      setParties((prevParties) =>
        prevParties.map((party) =>
          party.id === id ? { ...party, expired: true } : party
        )
      );
    });

    return () => {
      socket.off("partyExpired");
    };
  }, []);

  const postParty = async () => {
    setError(null); // Clear any previous errors

    if (!partyCode.trim() && !description.trim()) {
      setError("Please provide both a Party Code and a Description.");
      return;
    } else if (!partyCode.trim()) {
      setError("Please provide a Party Code.");
      return;
    } else if (!description.trim()) {
      setError("Please provide a Description.");
      return;
    }

    if (partyCode.length > 6) {
      setError("Party Code must be 6 characters or less");
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/parties`,
        {
          partyCode,
          description,
        }
      );
      setParties([response.data, ...parties]); // Prepend new party
      setPartyCode("");
      setDescription("");
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        setError(err.response.data.error);
      } else {
        setError("Failed to add party");
      }
    }
  };

  const pasteCode = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setPartyCode(text.slice(0, 6)); // Ensure the pasted text is limited to 6 characters
      setAlertVisible(true); // Show alert
      setTimeout(() => {
        setAlertVisible(false); // Hide alert after 5 seconds
      }, 5000);
    } catch (err) {
      console.error("Failed to read clipboard contents: ", err);
      setError("Failed to paste code from clipboard.");
    }
  };

  const closeAlert = () => {
    setAlertVisible(false);
  };

  const getLocalTime = (time) => {
    return moment.utc(time).tz("Asia/Manila").fromNow();
  };


  const adjustHeight = (element) => {
    element.style.height = "auto";
    element.style.height = element.scrollHeight + "px";
  };

  return (
    <div className="container mx-auto mt-10">
      <div
        className={`fixed top-0 left-1/2 transform -translate-x-1/2 mt-4 z-50 transition-opacity duration-300 ${
          alertVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex flex-col gap-2 w-60 sm:w-72 text-[10px] sm:text-xs z-50">
          <div className="error-alert cursor-default flex items-center justify-between w-full h-12 sm:h-14 rounded-lg bg-[#10151b] px-[10px]">
            <div className="flex gap-2">
              <div className=" bg-[#171f28] backdrop-blur-xl p-1 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  x="0px"
                  y="0px"
                  width="30"
                  height="30"
                  viewBox="0 0 48 48"
                >
                  <path
                    fill="#c8e6c9"
                    d="M44,24c0,11.045-8.955,20-20,20S4,35.045,4,24S12.955,4,24,4S44,12.955,44,24z"
                  ></path>
                  <path
                    fill="#4caf50"
                    d="M34.586,14.586l-13.57,13.586l-5.602-5.586l-2.828,2.828l8.434,8.414l16.395-16.414L34.586,14.586z"
                  ></path>
                </svg>
              </div>
              <div>
                <p className="text-white">Success</p>
                <p className="text-gray-500 text-md">
                  Code pasted successfully
                </p>
              </div>
            </div>
            <button
              className="text-gray-600 hover:bg-white/10 p-1 rounded-md transition-colors ease-linear"
              onClick={closeAlert}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center ">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl text-white font-bold text-center">
            Invite Players by Party Code
          </h2>
          {error && (
            <div className="text-red-500 text-center mt-2">{error}</div>
          )}
          <div className="flex flex-row space-x-2 items-center mt-4">
            <input
              className="flex-grow p-2 rounded text-white bg-[#374151]"
              type="text"
              placeholder="Party Code"
              value={partyCode}
              onChange={(e) => setPartyCode(e.target.value)}
              maxLength={6}
            />
            <button
              className="bg-green-600 hover:bg-green-700 text-white font-bold p-2 h-full rounded transition duration-150 ease-in-out flex items-center space-x-1"
              onClick={pasteCode}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5 4a2 2 0 00-2 2v10a2 2 0 002 2h6a2 2 0 002-2H5V4z"
                  clipRule="evenodd"
                />
                <path d="M13 2H7a2 2 0 00-2 2v10h2V4h6v10h2V4a2 2 0 00-2-2z" />
              </svg>
              <span>Paste Code</span>
            </button>
          </div>

          <textarea
            className="w-full p-2 mt-4 rounded bg-[#374151] resize-none"
            placeholder="a little bit of text ex: need 2, need 1"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              adjustHeight(e.target);
            }}
            style={{ overflow: "hidden" }}
          ></textarea>
          <button
            className="bg-[#101c2e] text-white p-2 mt-4 rounded hover:bg-[#0c1624] font-bold transition duration-150 ease-in-out w-full"
            onClick={postParty}
          >
            Post Invite
          </button>
        </div>
      </div>
      <div className="bg-gray-800 p-6 mt-4 rounded-lg shadow-lg mb-5">
        <h2 className="text-2xl text-white font-bold">All Parties</h2>
        <p className="text-xs text-gray-500">Most recent to Oldest</p>
        <p className="text-xs text-red-500">
          All posts will have 5 minutes until status is set to expired
        </p>

        {parties.length === 0 ? (
          <div className="text-white">No parties found</div>
        ) : (
          parties.map((party, index) => (
            <div key={index} className="bg-gray-700 p-4 mt-2 rounded">
              <h3 className="text-xl text-white">
                <span className="font-bold text-[#6dfed8] p-[3px] text-2xl">
                  {party.party_code.toUpperCase()}
                </span>
              </h3>
              <p className="text-gray-400 text-xs">
                Posted {getLocalTime(party.created_at)}
              </p>
              <p className="text-white">{party.description}</p>

              <p
                className={`text-sm ${
                  party.expired ? "text-red-500" : "text-green-500"
                }`}
              >
                {party.expired ? "Expired" : "Active"}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PartyFinder;

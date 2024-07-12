import React, { useState, useEffect } from "react";
import axios from "axios";
import moment from "moment-timezone";
import io from "socket.io-client";
import Select from "react-select";

const socket = io(process.env.REACT_APP_SOCKET_URL);

const PartyFinder = () => {
  const [parties, setParties] = useState([]);
  const [partyCode, setPartyCode] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [serverTag, setServerTag] = useState("");
  const [filter, setFilter] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [rankFilter, setRankFilter] = useState("");
  const [gamemodeFilter, setGamemodeFilter] = useState("");

  const tagOptions = [
    { value: "has mic", label: "has mic" },
    { value: "speaks tagalog", label: "speaks tagalog" },
   
  ];
  const [rank, setRank] = useState("");
  const [gamemode, setGamemode] = useState("");

  const getRankStyle = (rank) => {
    switch (rank) {
      case "IRON":
        return "bg-[#6c6b6f] text-white";
      case "BRONZE":
        return "bg-[#7c5200] text-white";
      case "SILVER":
        return "bg-[#fefefe] text-black";
      case "GOLD":
        return "bg-[#d1871b] text-white";
      case "PLATINUM":
        return "bg-[#2c8392] text-white";
      case "DIAMOND":
        return "bg-[#d880ee] text-white";
      case "ASCENDANT":
        return "bg-[#0b512f] text-white";
      case "IMMORTAL":
        return "bg-[#b9364d] text-white";
      case "RADIANT":
        return "bg-[#ffffa5] text-black ";
      default:
        return "bg-gray-200 text-gray-800"; 
    }
  };


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
        setError("");
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

    socket.on("newParty", (newParty) => {
      setParties((prevParties) => [newParty, ...prevParties]);
    });

    return () => {
      socket.off("partyExpired");
      socket.off("newParty");
    };
  }, []);

  const postParty = async () => {
    setError(null); // Reset error state

    

    // Validation checks
    if (!partyCode.trim() && !description.trim()) {
      setError("Please provide both a Party Code and a Description.");
      return;
    } else if (!partyCode.trim()) {
      setError("Please provide a Party Code.");
      return;
    } else if (!description.trim()) {
      setError("Please provide a Description.");
      return;
    } else if (!serverTag.trim()) {
      setError("Please select a Server.");
      return;
    } else if (!rank.trim()) {
      setError("Please select a rank.");
      return;
    } else if (!gamemode.trim()) {
      setError("Please select a gamemode.");
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
          serverTag,
          add_tags: selectedTags,
          rank,
          gamemode,
        }
      );

      if (response.status === 200) {
        console.log("Party added successfully:", response.data);
        setAlertMessage("Party added successfully");
        setAlertVisible(true);
        setTimeout(() => {
          setAlertVisible(false);
        }, 5000);
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        if (err.response.data.error.includes("profanity")) {
          setError("Please avoid using profane language in your description.");
        } else {
          setError(err.response.data.error);
        }
      } else {
        setError("Failed to add party");
      }
    }
  };

  const pasteCode = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setPartyCode(text.slice(0, 6));
      setAlertVisible(true);
      setAlertMessage("Code pasted successfully");
      setTimeout(() => {
        setAlertVisible(false);
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

  const filteredParties = parties.filter((party) => {
    return (
      (filter === "" || party.server_tag === filter) &&
      (rankFilter === "" ||
        rankFilter === "ANY" ||
        party.rank === rankFilter) &&
      (gamemodeFilter === "" || party.gamemode === gamemodeFilter)
    );
  });

  const handleTagChange = (selectedOptions) => {
    setSelectedTags(selectedOptions.map((option) => option.value));
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
                <p className="text-gray-500 text-md">{alertMessage}</p>
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
          <p className="text-gray-300 text-justify mt-2">
            Welcome to ValoParty! Just post your party code and players will
            join. Connect with fellow gamers and enjoy seamless gaming sessions!
          </p>

          {error && (
            <div className="text-red-500 text-center mt-2 font-bold">
              {error}
            </div>
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

          <div className="mt-5">
            <select
              value={serverTag}
              onChange={(e) => setServerTag(e.target.value)}
              className="bg-gray-700 text-white p-2 rounded w-full"
            >
              <option value="">Select Server</option>
              <option value="NA">NA Server</option>
              <option value="LATAM">LATAM Server</option>
              <option value="BR">BR Server</option>
              <option value="EU">EU Server</option>
              <option value="KR">KR Server</option>
              <option value="AP">AP Server</option>
            </select>
          </div>

          <div className="mt-5">
            <select
              value={rank}
              onChange={(e) => setRank(e.target.value)}
              className="bg-gray-700 text-white p-2 rounded w-full"
              required
            >
              <option value="">Select Rank</option>
              <option value="ANY">Any</option>
              <option value="IRON">Iron</option>
              <option value="BRONZE">Bronze</option>
              <option value="SILVER">Silver</option>
              <option value="GOLD">Gold</option>
              <option value="PLATINUM">Platinum</option>
              <option value="DIAMOND">Diamond</option>
              <option value="ASCENDANT">Ascendant</option>
              <option value="IMMORTAL">Immortal</option>
              <option value="RADIANT">Radiant</option>
            </select>
          </div>

          <div className="mt-5">
            <select
              value={gamemode}
              onChange={(e) => setGamemode(e.target.value)}
              className="bg-gray-700 text-white p-2 rounded w-full"
              required
            >
              <option value="">Select Game Mode</option>
              <option value="unrated">Unrated</option>
              <option value="competitive">Competitive</option>
            </select>
          </div>

          <div className="mt-5">
            <Select
              isMulti
              name="tags"
              options={tagOptions}
              className="basic-multi-select bg-gray-700 text-black font-semibold"
              classNamePrefix="select"
              placeholder="Select additional tags"
              onChange={handleTagChange}
              value={tagOptions.filter((option) =>
                selectedTags.includes(option.value)
              )}
            />
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

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mt-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-700 text-white p-2 rounded"
          >
            <option value="">All Servers</option>
            <option value="NA">NA Server</option>
            <option value="LATAM">LATAM Server</option>
            <option value="BR">BR Server</option>
            <option value="EU">EU Server</option>
            <option value="KR">KR Server</option>
            <option value="AP">AP Server</option>
          </select>

          <select
            value={rankFilter}
            onChange={(e) => setRankFilter(e.target.value)}
            className="bg-gray-700 text-white p-2 rounded"
          >
            <option value="">Filter by Rank</option>
            <option value="ANY">ALL RANKS</option>
            <option value="IRON">IRON</option>
            <option value="BRONZE">BRONZE</option>
            <option value="SILVER">SILVER</option>
            <option value="GOLD">GOLD</option>
            <option value="DIAMOND">DIAMOND</option>
            <option value="ASCENDANT">ASCENDANT</option>
            <option value="IMMORTAL">IMMORTAL</option>
            <option value="RADIANT">RADIANT</option>
          </select>

          <select
            value={gamemodeFilter}
            onChange={(e) => setGamemodeFilter(e.target.value)}
            className="bg-gray-700 text-white p-2 rounded"
          >
            <option value="">Filter by Game Mode</option>
            <option value="unrated">Unrated</option>
            <option value="competitive">Competitive</option>
          </select>
        </div>

        {filteredParties.length === 0 ? (
          <div className="text-white mt-2 font-bold">No parties found</div>
        ) : (
          filteredParties.map((party, index) => (
            <div key={index} className="bg-gray-700 p-4 mt-2 rounded">
              <h3 className=" text-white">
                <span className="font-bold text-[#6dfed8] text-2xl">
                  {party.party_code.toUpperCase()}
                </span>
                <div className="flex flex-row">
                  <div className="mt-1">
                    {party.add_tags &&
                      party.add_tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="bg-green-200 text-green-300 text-xs font-medium me-1 px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300"
                        >
                          {tag}
                        </span>
                      ))}
                  </div>

                  {/* Display rank */}
                  {party.rank && (
                    <div className="mt-1">
                      <span
                        className={`${getRankStyle(
                          party.rank
                        )} text-xs font-bold me-1 px-2.5 py-0.5 rounded-full `}
                      >
                        {party.rank}
                      </span>
                    </div>
                  )}

                  {/* Display gamemode */}
                  {party.gamemode && (
                    <div className="mt-1">
                      <span className="bg-purple-200 text-purple-800 text-xs font-medium me-1 px-2.5 py-0.5 rounded-full dark:bg-purple-900 dark:text-purple-300">
                        {party.gamemode}
                      </span>
                    </div>
                  )}
                </div>

                <span>
                  <p
                    className={`text-sm mt-1 font-bold ${
                      party.expired ? "text-red-500" : "text-green-500"
                    }`}
                  >
                    {party.expired ? "Expired" : "Active"}{" "}
                    <span className="text-white">-</span>&nbsp;
                    <span className="bg-yellow-100 text-yellow-800 text-sm font-regular me-2 px-2.5 py-0.5 rounded dark:bg-yellow-900 dark:text-yellow-300">
                     {party.server_tag} Server
                    </span>{" "}
                  </p>
                </span>
              </h3>

              <p className="text-white">{party.description}</p>
              <p className="text-gray-400 text-[11.5px]">
                Posted {getLocalTime(party.created_at)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PartyFinder;

import React, { useState, useEffect } from "react";
import axios from "axios";
import moment from "moment-timezone";
import io from "socket.io-client";
import Select from "react-select";
import partnerLogo from "./partners/araxys.jpg"; // Ensure the path is correct

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
  const [statusFilter, setStatusFilter] = useState("");
  const [rank, setRank] = useState("");
  const [gamemode, setGamemode] = useState("");
  const [loading, setLoading] = useState(true);
  const [uniquePosts, setUniquePosts] = useState(new Set());
  const [displayedPosts, setDisplayedPosts] = useState([]);



  const fetchPosts = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/posts`);
      const data = await response.json();
      const format = /[A-Za-z]{3}\d{3}/; // Regular expression to match the format

      // Filter out duplicate posts, extract codes, and exclude posts without a code or with a repeated code
      const newPosts = data
        .filter((post) => !uniquePosts.has(post))
        .map((post) => {
          const match = post.match(format);
          return match ? { code: match[0], text: post } : null;
        })
        .filter((post) => post !== null && !uniquePosts.has(post.code)); // Exclude posts without a code and repeated codes

      // Update uniquePosts set
      setUniquePosts((prevUniquePosts) => {
        const updatedUniquePosts = new Set(prevUniquePosts);
        newPosts.forEach((post) => updatedUniquePosts.add(post.code));
        return updatedUniquePosts;
      });

      // Update displayedPosts array to add new posts on top
      setDisplayedPosts((prevPosts) => [...newPosts, ...prevPosts]);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    }
  };


   useEffect(() => {
     fetchPosts();

     const intervalId = setInterval(fetchPosts, 60 * 1000); //1 minute

     // Clean up interval on component unmount
     return () => clearInterval(intervalId);
   }, []);


  useEffect(() => {


    const loadImage = new Image();
    loadImage.src = partnerLogo;

    loadImage.onload = () => {
      setTimeout(() => {
        setLoading(false);
      }, 3000);
    };

    loadImage.onerror = () => {
      setTimeout(() => {
        setLoading(false);
      }, 3000);
    };
  }, []);

  const tagOptions = [
    { value: "has mic", label: "has mic" },
    { value: "speaks tagalog", label: "speaks tagalog" },
    { value: "speaks english", label: "speaks english" },
    { value: "speaks bisaya", label: "speaks bisaya" },
    { value: "preferably female", label: "preferably female" },
    { value: "preferably male", label: "preferably male" },
  ];

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

    socket.on("partyDeleted", (id) => {
      setParties((prevParties) =>
        prevParties.filter((party) => party.id !== id)
      );
    });

    socket.on("newParty", (newParty) => {
      setParties((prevParties) => [newParty, ...prevParties]);
    });

    return () => {
      socket.off("partyExpired");
      socket.off("newParty");
      socket.off("partyDeleted");
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

  const clearFilters = () => {
    setFilter("");
    setRankFilter("");
    setGamemodeFilter("");
    setStatusFilter("");
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
      (gamemodeFilter === "" || party.gamemode === gamemodeFilter) &&
      (statusFilter === "" ||
        (statusFilter === "ACTIVE" && !party.expired) ||
        (statusFilter === "EXPIRED" && party.expired))
    );
  });

  const handleTagChange = (selectedOptions) => {
    setSelectedTags(selectedOptions.map((option) => option.value));
  };

  const copyToClipboard = async (partyCode) => {
    try {
      await navigator.clipboard.writeText(partyCode);
      setAlertMessage("Successfully copied"); // Set the success message
      setAlertVisible(true); // Show the alert
      setTimeout(() => {
        setAlertVisible(false); // Hide the alert after some time
      }, 5000);
    } catch (err) {
      console.error("Failed to copy to clipboard: ", err);
      // Optionally handle error (e.g., show an error alert)
    }
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
          <h1 className="text-2xl text-[#fe4554] font-bold text-center">
            Welcome to Valorant Party Finder
          </h1>
          <h2 className="text-md text-white font-semibold text-center mt-2">
            Connect on Riot Games for Competitive and Casual Valorant Matches
          </h2>

          <p className="text-gray-300 text-justify mt-2">
            Post your party code and connect with players for exciting Valorant
            matches on Riot Games. Whether it's casual or competitive, join the
            Valorant community and dive into the action today!
          </p>

          {/* <div className="mt-5">
            <h1 className="font-regular mb-2 gold-sparkle tracking-wider">
              Official Partners
            </h1>
            <div className="flex flex-row space-x-2">
              <span className="flex flex-col items-center">
                {loading ? (
                  <div
                    role="status"
                    className="animate-pulse h-20 w-20 rounded-full bg-slate-400"
                  ></div>
                ) : (
                  <a
                    href="https://discord.com/invite/p58TSsz3"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={partnerLogo}
                      alt="Official Partner"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                    <h2 className="text-xs font-bold gold-sparkle2 tracking-wider mt-1">
                      Araxys Esports
                    </h2>
                  </a>
                )}
              </span>
            </div>
          </div> */}

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
            All posts will have 5 minutes until status is set to expired.
          </p>
          <p className="text-xs text-red-500">
            Posts will be automatically removed 1 hour after they are published.
          </p>

          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mt-4 mb-5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-700 text-white p-2 rounded"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRED">Expired</option>
            </select>
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

            {(filter !== "" ||
              rankFilter !== "" ||
              gamemodeFilter !== "" ||
              statusFilter !== "") && (
              <button
                onClick={clearFilters}
                className="bg-red-500 text-white p-2 rounded hover:bg-red-700 transition duration-300"
              >
                Clear Filters
              </button>
            )}
          </div>

          {filteredParties.length === 0 ? (
            <div className="text-white mt-2 font-bold">No parties found</div>
          ) : (
            filteredParties.map((party, index) => (
              <div key={index} className="bg-gray-700 p-4 mt-2 rounded">
                <h3 className=" text-white">
                  <span
                    className="font-bold text-[#6dfed8] text-2xl cursor-pointer"
                    onClick={() => copyToClipboard(party.partyCode)}
                  >
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
                      <span className="bg-yellow-100 text-yellow-800 text-sm font-regular me-2 px-1 py-0.5 rounded dark:bg-yellow-900 dark:text-yellow-300">
                        {party.server_tag} Server
                      </span>{" "}
                    </p>
                  </span>
                </h3>

                <p className="text-white bg-slate-600  p-2 rounded mt-2 mb-2">
                  {party.description}
                </p>
                <p className="text-gray-400 text-[11.5px]">
                  Posted {getLocalTime(party.created_at)}
                </p>
              </div>
            ))
          )}
        </div>
        {/* <div className="bg-gray-800 p-6 mt-4 rounded-lg shadow-lg mb-5">
          <h1 className="font-bold">Posts from ValorantPH</h1>

          {displayedPosts.map((post, index) => (
            <div key={index} className="bg-gray-700 p-4 mt-2 rounded">
              <h3 className="text-white">
                <span
                  className="font-bold text-[#6dfed8] text-2xl cursor-pointer"
                  onClick={() => copyToClipboard(post.code)}
                >
                  {post.code.toUpperCase()}
                </span>
                <div className="flex flex-row">
                  <div className="mt-1">
                    <span
                      className={`bg-[#0866ff] text-white text-xs font-bold me-1 px-2.5 py-0.5 rounded-full `}
                    >
                      FROM FACEBOOK
                    </span>
                  </div>
                </div>
              </h3>
              <p className="text-white bg-slate-600 p-2 rounded mt-2 mb-2">
                {post.text}
              </p>
            </div>
          ))}
        </div> */}
      

      <footer className="mt-10 text-center mb-3 text-sm">
        For reports/suggestions please click this link:&nbsp;
        <a
          href="https://forms.gle/WsySHL4RzT6fcW7a7"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-700"
        >
          Submit feedback/reports
        </a>
      </footer>
    </div>
  );
};

export default PartyFinder;

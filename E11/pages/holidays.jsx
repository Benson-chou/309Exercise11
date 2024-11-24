import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";

const provinces = [
    { code: "All", name: "All" },
    { code: "AB", name: "Alberta" },
    { code: "BC", name: "British Columbia" },
    { code: "MB", name: "Manitoba" },
    { code: "NB", name: "New Brunswick" },
    { code: "NL", name: "Newfoundland and Labrador" },
    { code: "NS", name: "Nova Scotia" },
    { code: "ON", name: "Ontario" },
    { code: "PE", name: "Prince Edward Island" },
    { code: "QC", name: "Quebec" },
    { code: "SK", name: "Saskatchewan" },
    { code: "NT", name: "Northwest Territories" },
    { code: "NU", name: "Nunavut" },
    { code: "YT", name: "Yukon" }
  ];

const HolidayFilter = () => {
    const router = useRouter();

    const { year: yearQuery, province: provinceQuery, page: pageQuery, search: searchQuery} = router.query;

    const [year, setYear] = useState(parseInt(yearQuery) || 2024);
    const [province, setProvince] = useState(provinceQuery || "All");
    const [search, setSearch] = useState(searchQuery || "");
    const [holidays, setHolidays] = useState([]);
    const [currentPage, setCurrentPage] = useState(parseInt(pageQuery) || 1);
    const holidaysPerPage = 10;

    useEffect(() => {
        const fetchHolidays = async (year, province) => {
            let apiUrl = `https://canada-holidays.ca/api/v1/holidays?year=${year}`;
 
            const response = await fetch(apiUrl);
            const data = await response.json();
            setHolidays(data.holidays || []);
        }
        fetchHolidays(year, province)}
, [year, province]);
    
    // Update query parameters whenever filters, pagination, or search query changes
    useEffect(() => {
        router.push({
            pathname: router.pathname,
            query: {
                year: year, 
                province: province,
                search: search,
                page: currentPage
            }
        }, undefined, { shallow: true });
    }, [year, province, search, currentPage]);

    // Handler for year dropdown
    const handleYearChange = (e) => {
        setYear(e.target.value);
        setCurrentPage(1);
    };

    // Handler for province dropdown
    const handleProvinceChange = (e) => {
        setProvince(e.target.value);
        setCurrentPage(1);
    };

    // Handler for search bar
    const handleSearch = (e) => {
        setSearch(e.target.value);
        setCurrentPage(1);
    };


    // Memoized filtered holidays
    const filteredHolidays = useMemo(() => {
        if (province === "All" && search === "") {
            return undefined;
        }
        else if (province !== "All" && search === "") {
            return holidays.filter((holiday) => holiday.provinces.some((prov) => prov.id === province));
        }
        // (holidays.forEach((holiday) => {console.log(holiday.nameEn.toLowerCase().includes(search))}));;
        else {
            const toReturn = holidays.filter((holiday) => {
                return (province === "All" || holiday.provinces.some((prov) => prov.id === province)) &&
                holiday.nameEn.toLowerCase().includes(search.toLowerCase());
                }
            )
            return toReturn;
        }
    }, [holidays, search, province]);

        

    // Pagination logic
    const indexOfLastHoliday = currentPage * holidaysPerPage;
    const indexOfFirstHoliday = indexOfLastHoliday - holidaysPerPage;
    const currentHolidays = holidays.slice(indexOfFirstHoliday, indexOfLastHoliday);

    const holidaysToDisplay = filteredHolidays ? filteredHolidays.slice(indexOfFirstHoliday, indexOfLastHoliday) : currentHolidays
    const nextPage = () => {
        if (currentPage < Math.ceil(holidaysToDisplay.length / holidaysPerPage)) {
            setCurrentPage(currentPage + 1);
        }
    }

    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    }

    return (
        <div>
          <style jsx>{`
            * {
              font-family: "Arial";
            }
            h1 {
              text-align: center;
              color: #333;
              margin-bottom: 20px;
            }
    
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
    
            th,
            td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #ddd;
            }
    
            tr:hover {
              background-color: #f5f5f5;
            }
    
            th {
              background-color: #4caf50;
              color: white;
            }
          `}</style>
          <h1>Holidays </h1>
          {/* add a dropdown for years that range from 2020 to 2030 */}
          <div>
            <label htmlFor="year-filter">Year:</label>                  
            <select
                onChange={handleYearChange}
                value={year}
                style={{ marginBottom: "20px" }}
                id="year-filter"
                > 
                <option value="">Select a year</option>
                {Array.from({ length: 11 }, (_, i) => 2020 + i).map((year) => (
                    <option key={year} value={year}>
                    {year}
                    </option>
                ))}
            </select>
            </div>
            {/* Add a drop down for canada provinces with a default of all*/}
            <label htmlFor="province-filter">Province:</label>
            <select
                onChange={handleProvinceChange}
                value={province}
                style={{ marginBottom: "20px" }}
                id="province-filter"
                > 
                {provinces.map((province) => (
                    <option key={province.code} value={province.code}>
                    {province.name}
                    </option>
                ))}
            </select>
            {/* Add a search bar the holidays */}
            <input
                type="text"
                id="holiday-search"
                placeholder="Search for holidays..."
                value={search}
                onChange={handleSearch}
                style={{ marginBottom: "20px" }}
            />
          <table id="holidays-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Name</th>
                <th>Name (FR)</th> <th>Provinces</th>
              </tr>
            </thead>
            <tbody>
              {holidaysToDisplay.map((holiday) => (
                <tr key={holiday.id}>
                  <td>{holiday.date}</td>
                  <td>{holiday.nameEn}</td>
                  <td>{holiday.nameFr}</td>
                  <td>
                    {holiday.federal
                      ? "Federal"
                      : holiday.provinces.map((pr) => pr.id).join(" ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
              <div>
                <button id="next-page" onClick={prevPage}>Previous</button>
                <button id="prev-page" onClick={nextPage}>Next</button>
              </div>
        </div>
      );
}
export default HolidayFilter;
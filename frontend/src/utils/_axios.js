import Axios from "axios";
const baseURL =
	process.env.NODE_ENV === "development"
		? "http://localhost:5000/api/team-up-portal"
		: "https://ecell.iitm.ac.in/api/team-up-portal";

const axios = Axios.create({
	baseURL,
	withCredentials: true,
});

export default axios;
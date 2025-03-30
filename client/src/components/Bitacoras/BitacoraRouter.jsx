import {useParams} from "react-router-dom";
import {useState, useEffect} from "react";
import BitacoraDetailPage from "./BitacoraDetailPage";
import OldBitacoraDetailPage from "./OldBitacoraDetailPage";

const BitacoraRouter = ({edited}) => {
  const {id} = useParams();
  const [bitacora, setBitacora] = useState(null);
  const [loading, setLoading] = useState(true);
  const baseUrl = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    const fetchBitacora = async () => {
      try {
        const response = await fetch(`${baseUrl}/bitacora/${id}`, {
          method: "GET",
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();

          setBitacora(data);
          setLoading(false);
        } else {
          console.error("Failed to fetch bitácora:", response.statusText);
        }
      } catch (e) {
        console.error("Error fetching bitácora:", e);
      }
    };

    fetchBitacora();
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (!bitacora) return <p>Error: Bitácora no encontrada</p>;

  const oldBitacorasCount = import.meta.env.VITE_OLD_BITACORAS_COUNT;

  console.log(parseInt(bitacora.bitacora_id));

  return parseInt(bitacora.bitacora_id) <= oldBitacorasCount ? (
    <OldBitacoraDetailPage edited={edited} />
  ) : (
    <BitacoraDetailPage edited={edited} />
  );
};

export default BitacoraRouter;

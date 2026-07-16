/**
 * Conjunto de features do Framer Motion carregado sob demanda pelo
 * `LazyMotion`. Fica num chunk separado (import dinâmico), então o motor de
 * animação sai do bundle inicial — só chega depois do primeiro paint, quando
 * um overlay/transição realmente precisa dele.
 */
import { domMax } from "framer-motion";

export default domMax;

<script lang="ts">
import { goto } from "$app/navigation";
import { supabase } from "$lib/supabase";

async function randomRedirect() {
  await supabase
    .rpc("get_random_cover_slug")
    .then((res) => goto(`/cover/${res.data}`));
}

randomRedirect();
</script>
